"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useOrganization } from "@/contexts/organization-context";
import { logger } from "@mocah/shared";
import type { OrganizationMetadata } from "@/types/organization";
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
import { LiveEmailPreview } from "@/components/onboarding/live-email-preview";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const brandSettingsSchema = z.object({
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

type BrandSettingsFormValues = z.infer<typeof brandSettingsSchema>;

const EMAIL_SAFE_FONTS = [
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

export function BrandSettingsForm() {
  const { activeOrganization, updateOrganization } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const form = useForm<BrandSettingsFormValues>({
    resolver: zodResolver(brandSettingsSchema),
    defaultValues: {
      brandName: activeOrganization?.name || "",
      primaryColor: activeOrganization?.metadata?.primaryColor || "#3B82F6",
      secondaryColor: activeOrganization?.metadata?.secondaryColor || "#10B981",
      fontFamily: activeOrganization?.metadata?.fontFamily || "Arial, sans-serif",
      brandVoice: activeOrganization?.metadata?.brandVoice || "professional",
      logo: activeOrganization?.logo || "",
    },
  });

  // Update form when active organization changes
  useEffect(() => {
    if (activeOrganization) {
      // Parse metadata if it's a string from Better Auth
      let metadata: any = {};
      if (typeof activeOrganization.metadata === 'string') {
        try {
          metadata = JSON.parse(activeOrganization.metadata);
        } catch (error) {
          logger.error('Failed to parse metadata', { component: 'BrandSettingsForm' }, error as Error);
        }
      } else {
        metadata = activeOrganization.metadata || {};
      }
      
      form.reset({
        brandName: activeOrganization.name,
        primaryColor: metadata.primaryColor || "#3B82F6",
        secondaryColor: metadata.secondaryColor || "#10B981",
        fontFamily: metadata.fontFamily || "Arial, sans-serif",
        brandVoice: metadata.brandVoice || "professional",
        logo: activeOrganization.logo || "",
      });
      setLogoPreview(activeOrganization.logo || "");
    }
  }, [activeOrganization?.id, activeOrganization?.metadata, activeOrganization?.name, activeOrganization?.logo, form]);

  // Watch form values for live preview
  const watchedValues = form.watch();

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

  async function uploadLogo(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload logo");
      }

      const { url } = await response.json();
      return url;
    } catch (error) {
      logger.error(
        "Failed to upload logo",
        {
          component: "BrandSettingsForm",
          action: "uploadLogo",
          organizationId: activeOrganization?.id,
        },
        error as Error
      );
      throw error;
    }
  }

  async function onSubmit(values: BrandSettingsFormValues) {
    if (!activeOrganization) {
      toast.error("No active organization");
      return;
    }

    setIsLoading(true);
    try {
      // Upload logo if new file was selected
      let logoUrl = values.logo;
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }

      // Generate slug from brand name if name changed
      const slug =
        values.brandName !== activeOrganization.name
          ? values.brandName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "")
          : activeOrganization.slug;

      // Parse metadata if it's a string from Better Auth
      let existingMetadata: any = {};
      if (typeof activeOrganization.metadata === 'string') {
        try {
          existingMetadata = JSON.parse(activeOrganization.metadata);
        } catch (error) {
          logger.error('Failed to parse metadata', { component: 'BrandSettingsForm' }, error as Error);
        }
      } else {
        existingMetadata = activeOrganization.metadata || {};
      }
      
      const metadata: OrganizationMetadata = {
        primaryColor: values.primaryColor,
        secondaryColor: values.secondaryColor,
        fontFamily: values.fontFamily,
        brandVoice: values.brandVoice,
        logo: logoUrl,
        // Preserve existing fields
        setupCompleted: existingMetadata.setupCompleted,
        onboardingCompletedAt: existingMetadata.onboardingCompletedAt,
      };

      logger.debug('Submitting brand settings update', {
        component: 'BrandSettingsForm',
        action: 'onSubmit',
        organizationId: activeOrganization.id,
        metadata: metadata,
      });

      // Update organization
      await updateOrganization(activeOrganization.id, {
        name: values.brandName,
        slug: slug,
        logo: logoUrl,
        metadata: metadata,
      });

      logger.info("Brand settings updated successfully", {
        component: "BrandSettingsForm",
        action: "updateBrandSettings",
        organizationId: activeOrganization.id,
        organizationName: values.brandName,
      });
      toast.success("Brand settings updated successfully!");
      setLogoFile(null);
    } catch (error: any) {
      logger.error(
        "Failed to update brand settings",
        {
          component: "BrandSettingsForm",
          action: "updateBrandSettings",
          organizationId: activeOrganization?.id,
        },
        error
      );
      toast.error(error.message || "Failed to update brand settings");
    } finally {
      setIsLoading(false);
    }
  }

  if (!activeOrganization) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No active organization selected
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-2">
      {/* Left Side - Form */}
      <div className="space-y-6 bg-card p-6 shadow-2xl">
        <div>
          <h2 className="text-2xl font-bold">Brand Settings</h2>
          <p className="text-muted-foreground">
            Customize your brand identity and watch it come to life in the
            preview
          </p>
        </div>

        <Form {...form}>
          <form 
            key={activeOrganization.id} 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-6"
          >
            {/* Brand Name */}
            <FormField
              control={form.control}
              name="brandName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Acme Fashion Brand"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    The name of your brand or client
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Logo Upload */}
            <FormItem>
              <FormLabel>Logo</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  {logoPreview && (
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={logoPreview} />
                        <AvatarFallback>
                          {activeOrganization.name?.charAt(0)}
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
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview("");
                          form.setValue("logo", "");
                        }}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
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
                      disabled={isLoading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {logoPreview ? "Change Logo" : "Upload Logo"}
                    </Button>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                PNG, JPG, or SVG. Recommended size: 200x200px
              </FormDescription>
            </FormItem>

            {/* Primary Color */}
            <FormField
              control={form.control}
              name="primaryColor"
              render={({ field }) => (
                <FormItem>
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
                  <FormDescription>
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
                <FormItem>
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
                  <FormDescription>
                    Used for buttons and accents
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Font Family */}
            <FormField
              control={form.control}
              name="fontFamily"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Font Family *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a font" />
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
                  <FormDescription>
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
                <FormItem>
                  <FormLabel>Brand Voice *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand voice" />
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
                  <FormDescription>
                    AI will match this tone when generating copy
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isLoading}
              >
                Reset
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Right Side - Live Preview */}
      <div className="hidden lg:block bg-card p-6 shadow-2xl">
        <LiveEmailPreview
          brand={{
            brandName: watchedValues.brandName || activeOrganization.name,
            primaryColor: watchedValues.primaryColor,
            secondaryColor: watchedValues.secondaryColor,
            fontFamily: watchedValues.fontFamily,
            logo: logoPreview || activeOrganization.logo || undefined,
            brandVoice: watchedValues.brandVoice,
          }}
        />
      </div>
    </div>
  );
}
