"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Crown, Search, Filter, Check } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { TemplateLibraryPreviewModal } from "./TemplateLibraryPreviewModal";
import { TemplatePreview } from "@/components/template/TemplatePreview";
import { cn } from "@/lib/utils";

export function LibraryGrid() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [previewOpen, setPreviewOpen] = useState(false);

  // Fetch categories
  const { data: categoriesData } =
    trpc.template.getLibraryCategories.useQuery();
  const categories = categoriesData || [];

  // Fetch templates
  const { data, isLoading } = trpc.template.getLibraryTemplates.useQuery({
    search: search || undefined,
    categorySlug: selectedCategory,
    limit: 50,
  });

  const templates = data?.items || [];

  // Handle template query parameter (for direct links and callback after login)
  useEffect(() => {
    const templateId =
      searchParams.get("template") || searchParams.get("preview");
    if (templateId && templateId !== selectedTemplateId) {
      setSelectedTemplateId(templateId);
      setPreviewOpen(true);
    }
  }, [searchParams]);

  const handleTemplateClick = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setPreviewOpen(true);
    // Update URL to make it shareable
    router.push(`/library?template=${templateId}`, { scroll: false });
  };

  const handlePreviewClose = (open: boolean) => {
    setPreviewOpen(open);
    if (!open) {
      // Clean up URL when closing preview
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
                        ? categories.find((c) => c.slug === selectedCategory)
                            ?.name
                        : "All Categories"}
                    </span>
                    <span className="sm:hidden">
                      {selectedCategory
                        ? categories.find((c) => c.slug === selectedCategory)
                            ?.name
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
                        selectedCategory === undefined
                          ? "opacity-100"
                          : "opacity-0"
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
                          selectedCategory === category.slug
                            ? "opacity-100"
                            : "opacity-0"
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

        {/* Template Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-[200px] sm:auto-rows-[250px] lg:auto-rows-[300px]">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-full rounded-lg" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No templates found. Try a different search or category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-[200px] sm:auto-rows-[250px] lg:auto-rows-[300px]">
            {templates.map((template, index) => {
              // Vary row span for masonry effect (only on larger screens)
              const spanClass =
                index % 7 === 0 || index % 11 === 0 ? "sm:row-span-2" : "";

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
                    "relative group overflow-hidden bg-card border border-border cursor-pointer rounded-sm scale-99 hover:scale-100 transition-all ease-in-out duration-300",
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
                        className="object-top object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center">
                        No thumbnail available
                      </div>
                      
                    )}
                  </div>

                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90">
                        Preview
                      </span>
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
