"use client";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BrandKitData } from "../brand-configuration-modal";
import {
  FileText,
  Link2,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

// Validation schemas
const urlSchema = z.string().url("Please enter a valid URL");

interface BrandAIDataSectionProps {
  data: BrandKitData;
  onUpdate: (updates: Partial<BrandKitData>) => void;
  disabled?: boolean;
}

export function BrandAIDataSection({
  data,
  onUpdate,
  disabled,
}: BrandAIDataSectionProps) {
  const [copiedLink, setCopiedLink] = useState<number | null>(null);
  const [newLink, setNewLink] = useState("");
  const links = data.links || [];

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(index);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleAddLink = () => {
    const trimmed = newLink.trim();
    if (!trimmed) return;

    // Validate URL with Zod
    const result = urlSchema.safeParse(trimmed);
    if (!result.success) {
      toast.error(
        result.error.issues[0]?.message || "Please enter a valid URL"
      );
      return;
    }

    const validatedUrl = result.data;

    if (links.includes(validatedUrl)) {
      toast.error("This link already exists");
      return;
    }

    const updatedLinks = [...links, validatedUrl];
    onUpdate({ links: updatedLinks });
    setNewLink("");
    toast.success("Link added");
  };

  const handleUpdateLink = (index: number, value: string) => {
    const trimmed = value.trim();
    
    // If empty, remove the link
    if (!trimmed) {
      const updatedLinks = links.filter((_, i) => i !== index);
      onUpdate({ links: updatedLinks.length > 0 ? updatedLinks : null });
      return;
    }

    // Validate URL with Zod on blur
    const result = urlSchema.safeParse(trimmed);
    if (!result.success) {
      toast.error(
        result.error.issues[0]?.message || "Please enter a valid URL"
      );
      // Revert to original value
      return;
    }

    const validatedUrl = result.data;

    // Check for duplicates (excluding current index)
    if (links.includes(validatedUrl) && links.indexOf(validatedUrl) !== index) {
      toast.error("This link already exists");
      return;
    }

    const updatedLinks = [...links];
    updatedLinks[index] = validatedUrl;
    onUpdate({ links: updatedLinks });
  };

  const handleKeyDownLink = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddLink();
    }
  };

  return (
    <div className="space-y-4 px-6">
      {/* Section Header */}
      <div>
        <h3 className="text-base font-semibold">AI-Scraped Data</h3>
        <p className="sr-only">
          Information automatically detected from your website
        </p>
      </div>

      {/* Tabs for Summary and Links */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Links ({links.length})
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="summary">Brand Summary</Label>
              <Textarea
                id="summary"
                value={data.summary || ""}
                onChange={(e) => onUpdate({ summary: e.target.value || null })}
                placeholder="Enter website summary or leave empty to auto-generate from scraping..."
                disabled={disabled}
                rows={8}
                className="font-sans leading-relaxed text-muted-foreground shadow-md"
              />
              <p className="text-xs text-muted-foreground">
                This summary is used to provide context for AI-generated emails.
                It can be automatically generated from your website content or
                manually edited.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value="links" className="mt-4">
          <div className="space-y-4">
            {/* Add New Link */}
            <div className="space-y-2">
              <Label>Add Link</Label>
              <div className="flex gap-2">
                <Input
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  onKeyDown={handleKeyDownLink}
                  placeholder={`https://${data.companyName?.toLowerCase().replace(/ /g, "-")}/new-page` || "https://example.com/new-page"}
                  disabled={disabled}
                  className="flex-1 font-sans text-sm"
                />
                <Button
                  onClick={handleAddLink}
                  disabled={disabled || !newLink.trim()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Press Enter to add quickly
              </p>
            </div>

            {/* Links List */}
            {links.length > 0 ? (
              <div className="space-y-2">
                <Label>Links ({links.length})</Label>
                <ScrollArea className="h-[400px] rounded-lg border">
                  <div className="divide-y">
                    {links.map((link, index) => {
                      const isCopied = copiedLink === index;

                      return (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 group"
                        >
                          <span className="text-xs text-muted-foreground w-6 text-right shrink-0">
                            {index + 1}
                          </span>
                          <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <Input
                            value={link}
                            onChange={(e) => {
                              const updatedLinks = [...links];
                              updatedLinks[index] = e.target.value;
                              onUpdate({ links: updatedLinks });
                            }}
                            onBlur={(e) => handleUpdateLink(index, e.target.value)}
                            disabled={disabled}
                            className="flex-1 font-sans text-sm"
                          />
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(link, index)}
                              disabled={disabled}
                            >
                              {isCopied ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground">
                  These links help AI understand your site structure and
                  available content. You can edit links directly or leave empty to remove.
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-xl border-2 border-dashed text-center">
                <Link2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No links added yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add links manually or scrape your website to discover links
                  automatically
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Website Source */}
      {data.websiteUrl && (
        <div className="p-4 rounded-xl border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Source: {data.websiteUrl}
              </span>
            </div>
            <a
              href={data.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Visit Site
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
