"use client";

import { BrandExtendedFields } from "@/components/brand-kit/brand-extended-fields";
import Loader from "@/components/loader";
import MocahLoadingIcon from "@/components/mocah-brand/MocahLoadingIcon";
import { LiveEmailPreview } from "@/components/onboarding/live-email-preview";
import { ScrapingProgressInline } from "@/components/onboarding/scraping-progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
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
import { Separator } from "@/components/ui/separator";
import { useOrganization } from "@/contexts/organization-context";
import { authClient } from "@/lib/auth-client";
import { fileToApiFormat, validateImageFile } from "@/lib/file-utils";
import { cn } from "@/lib/utils";
import { trpcClient } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { EMAIL_SAFE_FONTS } from "@mocah/shared";
import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  Globe,
  Sparkles,
  Upload,
  X
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// ============================================================================
// Types & Schemas
// ============================================================================

const urlSchema = z.object({
  websiteUrl: z.string().min(1, "Please enter your website URL"),
});

const brandReviewSchema = z.object({
  // Core fields
  companyName: z.string().min(2, "Brand name must be at least 2 characters").max(100),
  logo: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color").optional().or(z.literal("")),
  fontFamily: z.string().min(1, "Please select a font"),
  brandVoice: z.enum(["professional", "casual", "playful", "luxury"]),
  
  // Extended fields (editable via accordion)
  tagline: z.string().optional(),
  companyDescription: z.string().optional(),
  industry: z.string().optional(),
  targetAudience: z.string().optional(),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color").optional().or(z.literal("")),
  textPrimaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color").optional().or(z.literal("")),
  borderRadius: z.string().optional(),
  brandTone: z.string().optional(),
  brandEnergy: z.string().optional(),
});

type UrlFormValues = z.infer<typeof urlSchema>;
type BrandReviewFormValues = z.infer<typeof brandReviewSchema>;

interface ScrapedBrandData {
  // Core colors
  primaryColor: string | null;
  accentColor: string | null;
  backgroundColor: string | null;
  textPrimaryColor: string | null;

  // Typography
  fontFamily: string;

  // Layout
  borderRadius: string | null;

  // Images
  logo: string | null;
  favicon: string | null;
  ogImage: string | null;

  // Personality
  brandVoice: string;
  brandTone: string | null;
  brandEnergy: string | null;

  // Company Info
  companyName: string | null;
  companyDescription: string | null;
  tagline: string | null;
  industry: string | null;
  productsServices: string[] | null;
  targetAudience: string | null;
  brandValues: string[] | null;
  socialLinks: Record<string, string> | null;
  contactEmail: string | null;
  foundingYear: string | null;

  // Firecrawl content
  summary: string | null;
  links: string[] | null;

  // Metadata
  websiteUrl: string | null;
  scrapedAt?: Date | null; // Optional - only set when saving
  scrapeConfidence: number | null;
}

// ============================================================================
// Main Component
// ============================================================================

function BrandSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = authClient.useSession();
  const { createOrganization, refreshOrganizations } = useOrganization();

  // Step: 1 = URL input, 2 = review/edit, "manual" = manual entry
  const urlStep = searchParams.get("step");
  const [step, setStep] = useState<"url" | "review" | "manual">(
    urlStep === "review" ? "review" : urlStep === "manual" ? "manual" : "url"
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedBrandData | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  // URL form
  const urlForm = useForm<UrlFormValues>({
    resolver: zodResolver(urlSchema),
    defaultValues: { websiteUrl: "" },
  });

  // Brand review form
  const brandForm = useForm<BrandReviewFormValues>({
    resolver: zodResolver(brandReviewSchema),
    defaultValues: {
      companyName: "",
      logo: "",
      primaryColor: "#3B82F6",
      accentColor: "#10B981",
      fontFamily: "Arial, sans-serif",
      brandVoice: "professional",
    },
  });

  // Sync step to URL
  const updateStep = (newStep: "url" | "review" | "manual") => {
    setStep(newStep);
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", newStep);
    router.replace(`/brand-setup?${params.toString()}`, { scroll: false });
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      const callbackUrl = encodeURIComponent("/brand-setup");
      router.push(`/login?callbackUrl=${callbackUrl}`);
    }
  }, [session, isPending, router]);

  // Logo upload mutation
  const uploadLogoMutation = useMutation({
    mutationFn: (data: { file: any; organizationId: string }) =>
      trpcClient.storage.uploadLogo.mutate(data),
  });

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleScrape = async (values: UrlFormValues) => {
    setIsScraping(true);
    setScrapeError(null);
    try {
      const result = await trpcClient.brandBuilder.preview.mutate({
        url: values.websiteUrl,
      });

      if (result.success && result.data) {
        const data = result.data;
        setScrapedData(data);

        // Pre-fill the review form with scraped data (core + extended fields)
        brandForm.reset({
          // Core fields
          companyName: data.companyName || "",
          logo: data.logo || "",
          primaryColor: data.primaryColor || "#3B82F6",
          accentColor: data.accentColor || "#10B981",
          fontFamily: data.fontFamily || "Arial, sans-serif",
          brandVoice: (data.brandVoice as BrandReviewFormValues["brandVoice"]) || "professional",
          // Extended fields
          tagline: data.tagline || "",
          companyDescription: data.companyDescription || "",
          industry: data.industry || "",
          targetAudience: data.targetAudience || "",
          backgroundColor: data.backgroundColor || "",
          textPrimaryColor: data.textPrimaryColor || "",
          borderRadius: data.borderRadius || "",
          brandTone: data.brandTone || "",
          brandEnergy: data.brandEnergy || "",
        });

        updateStep("review");
        toast.success("Brand detected successfully!");
      }
    } catch (error: any) {
      // Parse error message for user-friendly display
      const errorMessage = error.message || "";
      let friendlyError = "We couldn't access this website. Please check the URL and try again.";
      
      if (errorMessage.includes("DNS") || errorMessage.includes("resolution")) {
        friendlyError = "This domain doesn't seem to exist. Please double-check the URL.";
      } else if (errorMessage.includes("timeout") || errorMessage.includes("TIMEOUT")) {
        friendlyError = "The website took too long to respond. Please try again.";
      } else if (errorMessage.includes("blocked") || errorMessage.includes("403")) {
        friendlyError = "This website is blocking our access. You can set up your brand manually instead.";
      } else if (errorMessage.includes("not found") || errorMessage.includes("404")) {
        friendlyError = "Page not found. Please check if the URL is correct.";
      }
      
      setScrapeError(friendlyError);
    } finally {
      setIsScraping(false);
    }
  };

  const handleManualSetup = () => {
    setScrapedData(null);
    brandForm.reset({
      // Core fields
      companyName: "",
      logo: "",
      primaryColor: "#3B82F6",
      accentColor: "#10B981",
      fontFamily: "Arial, sans-serif",
      brandVoice: "professional",
      // Extended fields
      tagline: "",
      companyDescription: "",
      industry: "",
      targetAudience: "",
      backgroundColor: "",
      textPrimaryColor: "",
      borderRadius: "",
      brandTone: "",
      brandEnergy: "",
    });
    updateStep("manual");
  };

  const handleCompleteSetup = async (values: BrandReviewFormValues) => {
    setIsLoading(true);
    try {
      // Generate slug from company name
      const slug = values.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Create organization
        const newOrg = await createOrganization({
        name: values.companyName,
        slug,
        logo: values.logo || undefined,
          metadata: {
          setupCompleted: true,
          onboardingCompletedAt: new Date().toISOString(),
          },
        });

        if (!newOrg) throw new Error("Failed to create organization");

      // Upload logo if we have a file, or re-upload external scraped logo to our CDN
      let logoUrl = values.logo || "";
      if (logoFile) {
        // User uploaded a new logo file
        const fileData = await fileToApiFormat(logoFile);
        const uploadResult = await uploadLogoMutation.mutateAsync({
          file: fileData,
          organizationId: newOrg.id,
        });
        logoUrl = uploadResult.url;
      } else if (logoUrl && !logoUrl.startsWith("data:") && !logoUrl.includes("mocah.ai")) {
        // We have a scraped external logo - re-upload to our CDN for reliability
        try {
          const reuploadResult = await trpcClient.storage.reuploadExternalImage.mutate({
            url: logoUrl,
            type: "logo",
          });
          if (reuploadResult.wasReuploaded) {
            logoUrl = reuploadResult.url;
          }
        } catch (e) {
          // If re-upload fails, continue with external URL (non-blocking)
          console.warn("Failed to re-upload logo to CDN, using external URL:", e);
        }
      }

      // Update organization with brand kit
      await trpcClient.organization.updateWithBrandKit.mutate({
        organizationId: newOrg.id,
        organization: {
          logo: logoUrl || undefined,
        },
        brandKit: {
          // Core editable fields from form
          primaryColor: values.primaryColor,
          accentColor: values.accentColor || undefined,
          fontFamily: values.fontFamily,
          brandVoice: values.brandVoice,
          logo: logoUrl || undefined,
          companyName: values.companyName,
          
          // Extended editable fields from form (user can edit these)
          tagline: values.tagline || undefined,
          companyDescription: values.companyDescription || undefined,
          industry: values.industry || undefined,
          targetAudience: values.targetAudience || undefined,
          backgroundColor: values.backgroundColor || undefined,
          textPrimaryColor: values.textPrimaryColor || undefined,
          borderRadius: values.borderRadius || undefined,
          brandTone: values.brandTone || undefined,
          brandEnergy: values.brandEnergy || undefined,
          
          // Non-editable scraped data (from Firecrawl only)
          ...(scrapedData && {
            websiteUrl: scrapedData.websiteUrl ?? undefined,
            favicon: scrapedData.favicon ?? undefined,
            ogImage: scrapedData.ogImage ?? undefined,
            productsServices: scrapedData.productsServices ?? undefined,
            brandValues: scrapedData.brandValues ?? undefined,
            socialLinks: scrapedData.socialLinks ?? undefined,
            contactEmail: scrapedData.contactEmail ?? undefined,
            foundingYear: scrapedData.foundingYear ?? undefined,
            summary: scrapedData.summary ?? undefined,
            links: scrapedData.links ?? undefined,
            scrapedAt: scrapedData.scrapedAt ?? undefined,
            scrapeConfidence: scrapedData.scrapeConfidence ?? undefined,
          }),
        },
      });

      toast.success("Workspace setup complete!");
      await refreshOrganizations(newOrg.id);
      
      // Check if there are plan params from registration flow
      const plan = searchParams.get("plan");
      const interval = searchParams.get("interval");
      
      if (plan && interval) {
        // New user from pricing flow - redirect with new-user flag
        router.push(`/app?new-user=true&plan=${plan}&interval=${interval}`);
      } else {
        // Regular onboarding
        router.push("/app");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to complete setup");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        brandForm.setValue("logo", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    brandForm.setValue("logo", "");
  };

  // ============================================================================
  // Loading States
  // ============================================================================

  if (isPending) {
    return (
      <div className="h-screen flex-1 flex items-center justify-center">
        <MocahLoadingIcon />
      </div>
    );
  }

  if (!session?.user) return null;

  // Watched values for live preview
  const watchedValues = brandForm.watch();

  // Safely extract hostname from website URL
  const getHostname = (url: string | null): string | null => {
    if (!url) return null;
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="h-screen flex flex-col w-full">
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid lg:grid-cols-2 gap-0">
          {/* Left Side - Form */}
          <div className="overflow-y-auto bg-background px-4 py-8 md:px-12 flex flex-col justify-center">
            <div className="max-w-lg w-full mx-auto space-y-0 relative">
              {/* Header */}
              <Card className="rounded-b-none gap-0 p-0 pb-12 relative translate-y-4">
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full border text-xs",
                        step === "url"
                          ? "border-primary bg-primary text-primary-foreground"
                          : "text-primary"
                      )}
                    >
                      {step !== "url" ? <Check className="w-3 h-3" /> : "1"}
                    </span>
                    <span>Detect</span>
                  </div>
                  <div className="w-px h-4 bg-border" />
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full border text-xs",
                        step === "review" || step === "manual"
                          ? "border-primary bg-primary text-primary-foreground"
                          : ""
                      )}
                    >
                      2
                    </span>
                    <span className={step !== "url" ? "text-foreground" : ""}>
                      Customize
                    </span>
                  </div>
                </div>

                <Separator />

                <CardContent className="p-0 pt-2 text-center">
                  <h1 className="text-xl font-bold tracking-tight">
                    {step === "url"
                      ? "Let's detect your brand"
                      : step === "review"
                      ? "Review your brand"
                      : "Set up your brand"}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {step === "url"
                      ? "Enter your website and we'll extract your brand automatically"
                      : step === "review"
                      ? "We detected these brand elements - customize as needed"
                      : "Customize your brand identity"}
                  </p>
                </CardContent>
              </Card>

              {/* Step 1: URL Input */}
              {step === "url" && (
                <Form {...urlForm}>
                  <form
                    onSubmit={urlForm.handleSubmit(handleScrape)}
                    className="space-y-6 shadow-2xl rounded-xl border p-0 relative z-20 bg-card"
                  >
                    <FormField
                      control={urlForm.control}
                      name="websiteUrl"
                      render={({ field }) => (
                        <FormItem className="p-4 pt-6">
                          <FormLabel className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Website URL
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://yourcompany.com"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                if (scrapeError) setScrapeError(null);
                              }}
                              disabled={isScraping}
                              className="text-base [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:black] [&:-webkit-autofill]:text-black dark:[&:-webkit-autofill]:bg-gray-900 dark:[&:-webkit-autofill]:shadow-[0_0_0_30px_rgb(17_24_39)_inset] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:white] dark:[&:-webkit-autofill]:text-white"
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground pt-1">
                            We'll extract your brand colors, logo, fonts, and company info
                          </p>
                          
                          {/* Error Alert */}
                          {scrapeError && !isScraping && (
                            <Alert variant="destructive" className="mt-3 py-2">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-sm text-pretty">
                                {scrapeError}
                              </AlertDescription>
                            </Alert>
                          )}
                        </FormItem>
                      )}
                    />

                    <div className="px-4 pb-4 space-y-3">
                      {!isScraping ? (
                        <Button
                          type="submit"
                          className="w-full"
                          size="lg"
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Detect my brand
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          className="w-full pointer-events-none bg-primary/90"
                          size="lg"
                          
                        >
                          <ScrapingProgressInline isActive={isScraping} />
                          <Loader  />
                        </Button>
                      )}

                      {/* Full Progress Display
                      {isScraping && (
                        <ScrapingProgress isActive={isScraping} />
                      )} */}

                      {!isScraping && (
                        <Button
                          type="button"
                          onClick={handleManualSetup}
                          className="w-full"
                          variant="outline"
                          size="sm"
                        >
                          Skip - I'll set up manually
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              )}

              {/* Step 2: Review/Manual Form */}
              {(step === "review" || step === "manual") && (
                <Form {...brandForm}>
                  <form
                    onSubmit={brandForm.handleSubmit(handleCompleteSetup)}
                    className="space-y-0 shadow-2xl rounded-xl border p-0 relative z-20 bg-card max-h-[75vh] overflow-y-auto"
                  >
                    {/* Confidence indicator for scraped data */}
                    {step === "review" && scrapedData?.scrapeConfidence && (() => {
                      const hostname = getHostname(scrapedData.websiteUrl);
                      return (
                        <div className="px-4 pt-4">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                            <Sparkles className="w-3 h-3" />
                            <span>
                              {Math.round(scrapedData.scrapeConfidence * 100)}% confidence
                            </span>
                            {hostname && (
                              <span className="text-foreground/60">
                                from {hostname}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Brand Name & Logo Row */}
                    <div className="p-4 pt-4 border-b">
                      <div className="flex gap-4">
                        <FormField
                          control={brandForm.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Brand Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Acme Inc."
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                          control={brandForm.control}
                      name="logo"
                      render={({ field }) => (
                            <FormItem>
                              <FormLabel>Logo</FormLabel>
                          <FormControl>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-10 w-40 p-2 border">
                                  <AvatarImage src={field.value} className="object-contain" />
                                    <AvatarFallback className="text-xs">
                                      {watchedValues.companyName?.charAt(0) || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                  <div className="flex gap-1">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        document.getElementById("logo-upload")?.click()
                                      }
                                      disabled={isLoading}
                                    >
                                      <Upload className="h-3 w-3" />
                                    </Button>
                                    {field.value && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRemoveLogo}
                                        disabled={isLoading}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                  <input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleLogoUpload}
                                    disabled={isLoading}
                                  />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                      </div>
                    </div>

                    {/* Colors Row */}
                    <div className="p-4 border-b">
                      <div className="flex gap-4">
                    <FormField
                      control={brandForm.control}
                      name="primaryColor"
                      render={({ field }) => (
                            <FormItem className="flex-1">
                          <FormLabel>Primary Color</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                {...field}
                                    className="w-12 h-10 cursor-pointer p-1"
                                disabled={isLoading}
                              />
                              <Input
                                {...field}
                                placeholder="#3B82F6"
                                    className="flex-1 font-mono text-sm"
                                disabled={isLoading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={brandForm.control}
                      name="accentColor"
                      render={({ field }) => (
                            <FormItem className="flex-1">
                          <FormLabel>Accent Color</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={field.value || "#10B981"}
                                onChange={field.onChange}
                                    className="w-12 h-10 cursor-pointer p-1"
                                disabled={isLoading}
                              />
                              <Input
                                {...field}
                                placeholder="#10B981"
                                    className="flex-1 font-mono text-sm"
                                disabled={isLoading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                      </div>
                    </div>

                    {/* Font & Voice Row */}
                    <div className="p-4 border-b">
                      <div className="flex gap-4">
                      <FormField
                        control={brandForm.control}
                        name="fontFamily"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                            <FormLabel>Font Family</FormLabel>
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={brandForm.control}
                        name="brandVoice"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                            <FormLabel>Brand Voice</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                                value={field.value}
                              disabled={isLoading}
                            >
                              <FormControl>
                                  <SelectTrigger>
                                  <SelectValue placeholder="Select a voice" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="casual">Casual</SelectItem>
                                <SelectItem value="playful">Playful</SelectItem>
                                <SelectItem value="luxury">Luxury</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      </div>
                    </div>

                    {/* Extended Fields (Collapsible) */}
                    <div className="p-4 border-b">
                      <BrandExtendedFields
                        form={brandForm}
                        disabled={isLoading}
                        showConfidence={!!scrapedData}
                        confidence={scrapedData?.scrapeConfidence}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 p-4 sticky bottom-0 bg-card/50 backdrop-blur-sm border-t border-border">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => updateStep("url")}
                        disabled={isLoading}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            Creating...
                            <Loader/>
                          </>
                        ) : (
                          <>
                            Create Brand
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </div>
          </div>

          {/* Right Side - Live Preview */}
          <div className="hidden lg:block overflow-y-auto bg-muted/50 p-8">
            <LiveEmailPreview
              brand={{
                brandName: watchedValues.companyName || scrapedData?.companyName || "Your Brand",
                primaryColor: watchedValues.primaryColor || "#3B82F6",
                accentColor: watchedValues.accentColor || "#10B981",
                backgroundColor: watchedValues.backgroundColor || "#FFFFFF",
                textColor: watchedValues.textPrimaryColor || "#374151",
                borderRadius: watchedValues.borderRadius || "8px",
                fontFamily: watchedValues.fontFamily || "Arial, sans-serif",
                logo: watchedValues.logo || undefined,
                brandVoice: watchedValues.brandVoice || "professional",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BrandSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex-1 flex items-center justify-center">
          <MocahLoadingIcon />
        </div>
      }
    >
      <BrandSetupContent />
    </Suspense>
  );
}
