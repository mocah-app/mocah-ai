"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2, Sparkles } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Loader from "../loader";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  prompt: z.string().optional(),
  subject: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  isPremium: z.boolean(),
  regenerateThumbnail: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface EditLibraryEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  libraryEntry: {
    id: string;
    name: string;
    description: string | null;
    subject: string | null;
    category: string | null;
    tags: string[];
    isPremium: boolean;
  } | null;
  categories: { slug: string; name: string }[];
  onSave: (data: {
    libraryId: string;
    name: string;
    description?: string;
    subject?: string;
    category?: string;
    tags?: string[];
    isPremium?: boolean;
    regenerateThumbnail?: boolean;
  }) => Promise<void>;
  isSaving?: boolean;
}

export function EditLibraryEntryDialog({
  open,
  onOpenChange,
  libraryEntry,
  categories,
  onSave,
  isSaving = false,
}: EditLibraryEntryDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: libraryEntry?.name || "",
      prompt: libraryEntry?.description || "",
      subject: libraryEntry?.subject || "",
      category: libraryEntry?.category || "_none",
      tags: libraryEntry?.tags.join(", ") || "",
      isPremium: libraryEntry?.isPremium || false,
      regenerateThumbnail: false,
    },
  });

  React.useEffect(() => {
    if (libraryEntry) {
      form.reset({
        name: libraryEntry.name,
        prompt: libraryEntry.description || "",
        subject: libraryEntry.subject || "",
        category: libraryEntry.category || "_none",
        tags: libraryEntry.tags.join(", "),
        isPremium: libraryEntry.isPremium,
        regenerateThumbnail: false,
      });
    }
  }, [libraryEntry, form]);

  const handleSubmit = async (data: FormData) => {
    if (!libraryEntry) return;

    const tags = data.tags
      ? data.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

    await onSave({
      libraryId: libraryEntry.id,
      name: data.name,
      description: data.prompt,
      subject: data.subject,
      category: data.category === "_none" ? undefined : data.category,
      tags,
      isPremium: data.isPremium,
      regenerateThumbnail: data.regenerateThumbnail,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Library Entry</DialogTitle>
          <DialogDescription>
            Update your template's public listing
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            {/* Name & Description Group */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Template name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creation Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What's this template for?"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Line</FormLabel>
                    <FormControl>
                      <Input placeholder="Email subject" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Category & Tags Group */}
            <div className="grid grid-cols-[auto_1fr] items-start gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">No category</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.slug} value={cat.slug}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tags
                      <span className="text-xs text-muted-foreground">
                        comma-separated
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="welcome, newsletter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Options Group */}
            <div className="space-y-3 pt-2">
              <FormField
                control={form.control}
                name="isPremium"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-yellow-600" />
                      <div className="leading-none">
                        <FormLabel className="font-normal">
                          Premium Template
                        </FormLabel>
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="regenerateThumbnail"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-blue-600" />
                      <div className="leading-none">
                        <FormLabel className="font-normal">
                          Regenerate Thumbnail
                        </FormLabel>
                      </div>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader size="sm" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
