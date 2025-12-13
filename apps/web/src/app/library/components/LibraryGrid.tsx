"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Filter, Check } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { TemplateLibraryPreviewModal } from "./TemplateLibraryPreviewModal";
import { cn } from "@/lib/utils";

// Masonry layout helper - assigns row spans based on position for natural distribution
const getMasonrySpan = (index: number, columnCount: number): number => {
  // Create a varied but consistent pattern
  const patterns = {
    3: [1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2], // 3 columns
    2: [1, 2, 1, 1, 2, 1, 2, 1, 1, 2], // 2 columns
    1: [1, 1, 1, 1, 1, 1], // 1 column (mobile)
  };

  const pattern = patterns[columnCount as keyof typeof patterns] || patterns[3];
  return pattern[index % pattern.length];
};

export function LibraryGrid() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [columnCount, setColumnCount] = useState(3);

  // Track screen size for responsive column count
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setColumnCount(1);
      else if (width < 1024) setColumnCount(2);
      else setColumnCount(3);
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  // Fetch categories
  const { data: categoriesData } = trpc.template.getLibraryCategories.useQuery();
  const categories = categoriesData || [];

  // Fetch templates
  const { data, isLoading } = trpc.template.getLibraryTemplates.useQuery({
    search: search || undefined,
    categorySlug: selectedCategory,
    limit: 50,
  });

  const templates = data?.items || [];

  // Handle template query parameter
  useEffect(() => {
    const templateId = searchParams.get("template") || searchParams.get("preview");
    if (templateId && templateId !== selectedTemplateId) {
      setSelectedTemplateId(templateId);
      setPreviewOpen(true);
    }
  }, [searchParams, selectedTemplateId]);

  const handleTemplateClick = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setPreviewOpen(true);
    router.push(`/library?template=${templateId}`, { scroll: false });
  };

  const handlePreviewClose = (open: boolean) => {
    setPreviewOpen(open);
    if (!open) {
      router.push("/library", { scroll: false });
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="sr-only">Browse Template Library</h1>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto relative mb-8">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 bg-card shadow-sm rounded-full border border-border">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search templates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="dark:bg-transparent border-0 pl-11 pr-6 py-2 h-auto text-foreground placeholder:text-muted-foreground focus-visible:ring-0 text-sm sm:text-base rounded-full"
                />
              </div>

              {/* Category Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 sm:mr-2 whitespace-nowrap h-auto text-sm sm:text-base"
                  >
                    <Filter className="size-4" />
                    <span className="hidden sm:inline">
                      {selectedCategory
                        ? categories.find((c) => c.slug === selectedCategory)?.name
                        : "All Categories"}
                    </span>
                    <span className="sm:hidden">
                      {selectedCategory
                        ? categories.find((c) => c.slug === selectedCategory)?.name
                        : "All"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => setSelectedCategory(undefined)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        selectedCategory === undefined ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All Templates
                  </DropdownMenuItem>
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => setSelectedCategory(category.slug)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 size-4",
                          selectedCategory === category.slug ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {category.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Template Grid with Masonry Layout */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-[200px] sm:auto-rows-[240px] lg:auto-rows-[280px]">
            {Array.from({ length: 9 }).map((_, i) => {
              const span = getMasonrySpan(i, columnCount);
              return (
                <Skeleton
                  key={i}
                  className={cn(
                    "w-full h-full rounded-lg",
                    span === 2 && "row-span-2"
                  )}
                />
              );
            })}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No templates found. Try a different search or category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-[200px] sm:auto-rows-[240px] lg:auto-rows-[280px]">
            {templates.map((template, index) => {
              const rowSpan = getMasonrySpan(index, columnCount);
              const spanClass = rowSpan === 2 ? "row-span-2" : "";

              return (
                <div
                  key={template.id}
                  onClick={() => handleTemplateClick(template.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleTemplateClick(template.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "relative group overflow-hidden bg-card border border-border cursor-pointer rounded-lg transition-all duration-300 ease-out",
                    "hover:shadow-xl hover:scale-[1.02] hover:z-10",
                    spanClass
                  )}
                >
                  {/* Template Preview */}
                  <div className="absolute inset-0">
                    {template.thumbnail ? (
                      <Image
                        src={template.thumbnail}
                        alt={template.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center text-muted-foreground text-sm">
                        No thumbnail available
                      </div>
                    )}
                  </div>

                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all h-9 px-4 bg-white text-black hover:bg-white/90 shadow-lg transform translate-y-2 group-hover:translate-y-0">
                        Preview Template
                      </span>
                      <p className="text-white text-sm font-medium px-4 text-center line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity delay-75">
                        {template.name}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <TemplateLibraryPreviewModal
        open={previewOpen}
        onOpenChange={handlePreviewClose}
        templateId={selectedTemplateId}
      />
    </>
  );
}