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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Organization } from "@/types/organization";

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
  "Helvetica, sans-serif",
  "Georgia, serif",
  "Times New Roman, serif",
  "Courier New, monospace",
  "Verdana, sans-serif",
  "Trebuchet MS, sans-serif",
  "Impact, sans-serif",
  "Palatino, serif",
  "Garamond, serif",
  "Tahoma, sans-serif",
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
  submitButtonText = "Save Changes",
  submitButtonLoadingText = "Saving...",
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
  });

  // Update form when defaultValues or formKey changes (for settings page prefill)
  useEffect(() => {
    form.reset(defaultValues);
    setLogoPreview(defaultValues.logo || "");
    setLogoFile(null);
  }, [formKey, defaultValues.brandName, defaultValues.logo, defaultValues.fontFamily, defaultValues.brandVoice, defaultValues.primaryColor, defaultValues.secondaryColor]);

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
              <div className="space-y-4">
                {logoPreview && showAvatar && (
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={logoPreview} />
                      <AvatarFallback>
                        {organizationName?.charAt(0) ||
                          watchedValues.brandName?.charAt(0) ||
                          "B"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Current Logo</p>
                      {logoFile && (
                        <p className="text-xs text-muted-foreground">
                          {logoFile.name}
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
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("logo-upload")?.click()
                    }
                    disabled={isFormDisabled}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {logoPreview ? "Change Logo" : "Upload Logo"}
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
                <FormItem className="">
                  <div className="flex items-center gap-2">
                    <FormLabel>Font Family *</FormLabel>
                    <span className="text-xs text-muted-foreground">
                      Current:{" "}
                      {field.value?.split(",")[0] || defaultValues.fontFamily?.split(",")[0] || "Arial"}
                    </span>
                  </div>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Change font" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EMAIL_SAFE_FONTS.map((font) => (
                        <SelectItem key={font} value={font}>
                          <span style={{ fontFamily: font }}>
                            {font.split(",")[0]}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="sr-only">
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
              render={({ field }) => (
                <FormItem className="">
                  <div className="flex items-center gap-2">
                    <FormLabel>Brand Voice *</FormLabel>
                    <span className="text-xs text-muted-foreground">
                      Current:{" "}
                      {field.value
                        ? field.value.charAt(0).toUpperCase() +
                          field.value.slice(1)
                        : defaultValues.brandVoice
                        ? defaultValues.brandVoice.charAt(0).toUpperCase() +
                          defaultValues.brandVoice.slice(1)
                        : "Professional"}
                    </span>
                  </div>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Change brand voice" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="professional">
                        <div className="space-y-1">
                          <div className="font-semibold">Professional</div>
                          <div className="text-xs text-muted-foreground">
                            Formal and authoritative
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="casual">
                        <div className="space-y-1">
                          <div className="font-semibold">Casual</div>
                          <div className="text-xs text-muted-foreground">
                            Friendly and conversational
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="playful">
                        <div className="space-y-1">
                          <div className="font-semibold">Playful</div>
                          <div className="text-xs text-muted-foreground">
                            Fun and energetic
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="luxury">
                        <div className="space-y-1">
                          <div className="font-semibold">Luxury</div>
                          <div className="text-xs text-muted-foreground">
                            Elegant and sophisticated
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="sr-only">
                    AI will match this tone when generating copy
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
