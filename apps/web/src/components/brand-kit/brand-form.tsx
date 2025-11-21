"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Upload, Loader2, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Organization } from "@/types/organization";
import Loader from "../loader";

export const brandFormSchema = z.object({
  brandName: z
    .string()
    .min(2, "Brand name must be at least 2 characters")
    .max(50, "Brand name must be less than 50 characters"),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid hex color")
    .optional(),
  fontFamily: z.string().min(1, "Please select a font"),
  brandVoice: z.enum(["professional", "casual", "playful", "luxury"]),
  logo: z.string().optional(),
});

export type BrandFormValues = z.infer<typeof brandFormSchema>;

export const EMAIL_SAFE_FONTS = [
  "Arial, sans-serif",
  "Times New Roman, serif",
  "Verdana, sans-serif",
  "Georgia, serif",
  "Tahoma, sans-serif",
  "Helvetica, sans-serif",
  "Courier New, monospace",
  "Lucida Sans, Lucida Grande, sans-serif",
  "Trebuchet MS, sans-serif",
  "Palatino, Book Antiqua, serif",
];

export interface BrandFormData {
  values: BrandFormValues;
  logoFile: File | null;
  logoPreview: string;
}

interface BrandFormProps {
  defaultValues?: Partial<BrandFormValues>;
  onSubmit: (values: BrandFormValues, logoFile: File | null) => Promise<void>;
  onFormChange?: (data: BrandFormData) => void;
  isLoading?: boolean;
  submitButtonText?: string;
  submitButtonLoadingText?: string;
  showSecondaryButton?: boolean;
  secondaryButtonText?: string;
  secondaryButtonVariant?: "outline" | "ghost" | "destructive";
  onSecondaryButtonClick?: () => void;
  title?: string;
  description?: string;
  showAvatar?: boolean;
  organizationName?: string;
  formKey?: string;
  className?: string;
  activeOrganization?: Organization | null;
  disableWhenNoOrg?: boolean; // Disable form when no organization (for settings page)
}

export function BrandForm({
  defaultValues = {
    brandName: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#10B981",
    fontFamily: "Arial, sans-serif",
    brandVoice: "professional",
  },
  onSubmit,
  onFormChange,
  isLoading = false,
  submitButtonText = "Update Brand",
  submitButtonLoadingText = "Updating...",
  showSecondaryButton = false,
  secondaryButtonText = "Reset",
  secondaryButtonVariant = "outline",
  onSecondaryButtonClick,
  title,
  description,
  showAvatar = false,
  organizationName,
  formKey,
  className = "space-y-6 bg-card shadow-2xl",
  activeOrganization = null,
  disableWhenNoOrg = false,
}: BrandFormProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(
    defaultValues.logo || ""
  );

  // Compute disabled state: disable when loading OR (when disableWhenNoOrg is true and no org exists)
  const isFormDisabled = isLoading || (disableWhenNoOrg && !activeOrganization);

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues,
    values: defaultValues as BrandFormValues, // Use values prop to update form when defaultValues change
  });

  // Update logo preview and reset form when defaultValues or formKey changes
  useEffect(() => {
    setLogoPreview(defaultValues.logo || "");
    setLogoFile(null);
    // Reset form to defaultValues when formKey changes (triggered by reset button)
    if (formKey) {
      form.reset(defaultValues);
    }
  }, [defaultValues, formKey, form]);

  // Watch form values for live preview
  const watchedValues = form.watch();

  // Notify parent of form changes
  useEffect(() => {
    if (onFormChange) {
      onFormChange({
        values: watchedValues,
        logoFile,
        logoPreview,
      });
    }
  }, [
    watchedValues.brandName,
    watchedValues.primaryColor,
    watchedValues.secondaryColor,
    watchedValues.fontFamily,
    watchedValues.brandVoice,
    logoFile,
    logoPreview,
    onFormChange,
  ]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
    form.setValue("logo", "");
  };

  const handleSubmit = async (values: BrandFormValues) => {
    await onSubmit(values, logoFile);
  };

  return (
    <div className={cn(className, "w-full h-full")}>
      {(title || description) && (
        <div className="px-4 pt-6">
          {title && (
            <h2 className="text-xl font-medium text-foreground">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      <Form {...form}>
        <form
          key={formKey}
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6"
        >
          {/* Brand Name */}
          <FormField
            control={form.control}
            name="brandName"
            render={({ field }) => (
              <FormItem className="border-b pb-4 px-4">
                <FormLabel className="text-sm font-medium text-foreground">
                  Brand Name *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Acme Fashion Brand"
                    {...field}
                    disabled={isFormDisabled}
                  />
                </FormControl>
                <FormDescription className="text-xs text-muted-foreground">
                  The name of your brand or client
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Logo Upload */}
          <FormItem className="border-b pb-4 px-4">
            <FormLabel>Logo {!showAvatar && "(Optional)"}</FormLabel>
            <FormControl>
              <div className="flex items-center justify-between gap-4 border rounded-lg">
                {logoPreview && showAvatar && (
                  <div className="flex items-center gap-4 border-r pr-4 p-2">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={logoPreview} />
                      <AvatarFallback>
                        {organizationName?.charAt(0) ||
                          watchedValues.brandName?.charAt(0) ||
                          "B"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Current Logo</p>
                      {logoFile && (
                        <p className="text-sm truncate text-foreground font-medium">
                          {logoFile.name.length > 20 ? logoFile.name.slice(0, 20) + "..." : logoFile.name}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                      disabled={isFormDisabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {!showAvatar && logoPreview && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-12 w-12 object-contain"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                      disabled={isFormDisabled}
                    >
                      Remove
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-4 p-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("logo-upload")?.click()
                    }
                    disabled={isFormDisabled}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {logoPreview ? "Change" : "Upload Logo"}
                  </Button>
                  {!showAvatar && logoFile && (
                    <span className="text-sm text-muted-foreground">
                      {logoFile.name}
                    </span>
                  )}
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={isFormDisabled}
                  />
                </div>
              </div>
            </FormControl>
            <FormDescription className="text-xs text-muted-foreground">
              PNG, JPG, or SVG. Recommended size: 200x200px
            </FormDescription>
          </FormItem>

          {/* Primary Color */}
          <FormField
            control={form.control}
            name="primaryColor"
            render={({ field }) => (
              <FormItem className="border-b pb-4 px-4">
                <FormLabel>Primary Color *</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      {...field}
                      className="w-20 h-10 cursor-pointer"
                      disabled={isLoading}
                    />
                    <Input
                      type="text"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="#3B82F6"
                      className="flex-1"
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-xs text-muted-foreground">
                  Your main brand color used throughout templates
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Secondary Color */}
          <FormField
            control={form.control}
            name="secondaryColor"
            render={({ field }) => (
              <FormItem className="border-b pb-4 px-4">
                <FormLabel>Secondary Color (Optional)</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      {...field}
                      className="w-20 h-10 cursor-pointer"
                      disabled={isLoading}
                    />
                    <Input
                      type="text"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="#10B981"
                      className="flex-1"
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-xs text-muted-foreground">
                  Used for buttons and accents
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid md:grid-cols-2 gap-4 px-4 border-b pb-4">
            {/* Font Family */}
            <FormField
              control={form.control}
              name="fontFamily"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Font Family *</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {field.value && (
                        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                          <div className="flex-1">
                            <p
                              className="text-lg font-bold"
                              style={{ fontFamily: field.value }}
                            >
                              {field.value.split(",")[0]}
                            </p>
                            
                          </div>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isFormDisabled}
                              >
                                Change
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="end">
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">
                                  Select Font
                                </h4>
                                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                                  {EMAIL_SAFE_FONTS.map((font) => (
                                    <Button
                                      key={font}
                                      type="button"
                                      variant={
                                        field.value === font
                                          ? "secondary"
                                          : "ghost"
                                      }
                                      className="w-full justify-start"
                                      onClick={() => field.onChange(font)}
                                    >
                                      <span style={{ fontFamily: font }}>
                                        {font.split(",")[0]}
                                      </span>
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs text-pretty text-muted-foreground">
                    Email-safe fonts that work across all email clients
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Brand Voice */}
            <FormField
              control={form.control}
              name="brandVoice"
              render={({ field }) => {
                const voiceOptions = [
                  {
                    value: "professional",
                    label: "Professional",
                    description: "Formal and authoritative",
                  },
                  {
                    value: "casual",
                    label: "Casual",
                    description: "Friendly and conversational",
                  },
                  {
                    value: "playful",
                    label: "Playful",
                    description: "Fun and energetic",
                  },
                  {
                    value: "luxury",
                    label: "Luxury",
                    description: "Elegant and sophisticated",
                  },
                ];
                const currentVoice = voiceOptions.find(
                  (v) => v.value === field.value
                );

                return (
                  <FormItem>
                    <FormLabel>Brand Voice *</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {field.value && currentVoice && (
                          <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                            <div className="flex-1">
                              <p className="text-lg font-bold">
                                {currentVoice.label}
                              </p>
                            </div>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={isFormDisabled}
                                >
                                  Change
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80" align="end">
                                <div className="space-y-2">
                                  <h4 className="font-medium text-sm">
                                    Select Brand Voice
                                  </h4>
                                  <div className="space-y-1">
                                    {voiceOptions.map((voice) => (
                                      <Button
                                        key={voice.value}
                                        type="button"
                                        variant={
                                          field.value === voice.value
                                            ? "secondary"
                                            : "ghost"
                                        }
                                        className="w-full justify-start h-auto py-3"
                                        onClick={() =>
                                          field.onChange(voice.value)
                                        }
                                      >
                                        <div className="text-left">
                                          <div className="font-semibold">
                                            {voice.label}
                                          </div>
                                          <div className="text-xs text-pretty text-muted-foreground">
                                            {voice.description}
                                          </div>
                                        </div>
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs text-pretty text-muted-foreground">
                      AI will match this tone when generating copy
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 py-6 px-4">
            {showSecondaryButton && (
              <Button
                type="button"
                variant={secondaryButtonVariant}
                onClick={onSecondaryButtonClick}
                disabled={isLoading}
                className={secondaryButtonVariant === "outline" ? "" : "flex-1"}
              >
                {secondaryButtonText}
              </Button>
            )}
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader />
                  {submitButtonLoadingText}
                </>
              ) : (
                submitButtonText
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
