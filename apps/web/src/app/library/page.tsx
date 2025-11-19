"use client";

import EdgeRayLoader from "@/components/EdgeLoader";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface GalleryItem {
  id: number;
  image: string;
  likes: number;
  span?: string;
}

export default function LibraryPage() {
  const [generateLoading, setGenerateLoading] = useState(false);

  const handleGenerate = () => {
    setGenerateLoading(true);
    setTimeout(() => {
      setGenerateLoading(false);
    }, 1000);
  };

  const categories: string[] = [
    "All Templates",
    "Welcome",
    "Newsletter",
    "Promotional",
    "Transactional",
    "Announcement",
    "Event",
  ];

  const galleryItems: GalleryItem[] = [
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop",
      likes: 16,
    },
    {
      id: 2,
      image:
        "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=400&fit=crop",
      likes: 7,
    },
    {
      id: 3,
      image:
        "https://images.unsplash.com/photo-1610296669228-602fa827fc1f?w=400&h=400&fit=crop",
      likes: 17,
    },
    {
      id: 4,
      image:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop",
      likes: 0,
      span: "row-span-2",
    },
    {
      id: 5,
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop",
      likes: 32,
      span: "row-span-2",
    },
    {
      id: 6,
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
      likes: 0,
    },
    {
      id: 7,
      image:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
      likes: 0,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground w-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-xl md:text-3xl font-semibold mb-8">
            What template will you create?
          </h1>

          <div className="max-w-3xl mx-auto relative">
            <div className="flex items-center gap-4 bg-card shadow-sm pr-2 rounded-full border border-border relative overflow-hidden dark:bg-secondary">
              {generateLoading && <EdgeRayLoader />}
              <Input
                type="text"
                placeholder="Describe your template idea here..."
                className="flex-1 dark:bg-transparent border-0 px-6 py-4 h-auto text-foreground placeholder:text-muted-foreground focus-visible:ring-0 text-base"
              />
              <Button className="relative z-10" onClick={handleGenerate}>
                {generateLoading ? <Loader /> : "Generate"}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-6 mb-8 border-b border-border pb-4">
          {categories.map((category: string) => (
            <button
              key={category}
              className="text-muted-foreground hover:text-foreground transition-colors text-base"
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 auto-rows-[300px]">
          {galleryItems.map((item: GalleryItem) => (
            <div
              key={item.id}
              className={`relative group rounded-lg overflow-hidden bg-card ${
                item.span || ""
              }`}
            >
              <Image
                src={item.image}
                alt={`Email template ${item.id}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />

              {item.likes > 0 && (
                <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-background/50 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <Heart className="w-4 h-4 text-foreground" />
                  <span className="text-sm text-foreground">{item.likes}</span>
                </div>
              )}

              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
