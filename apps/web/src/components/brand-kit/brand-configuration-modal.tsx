"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOrganization } from "@/contexts/organization-context";
import { trpcClient } from "@/utils/trpc";
import { AlertCircle, Building2, Check, Loader2, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Section Components
import { LiveEmailPreview } from "@/components/onboarding/live-email-preview";
import MocahLoadingIcon from "../mocah-brand/MocahLoadingIcon";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { BrandConfigNav, type SectionId } from "./brand-config-nav";
import { BrandAIDataSection } from "./sections/brand-ai-data-section";
import { BrandColorsSection } from "./sections/brand-colors-section";
import { BrandCompanySection } from "./sections/brand-company-section";
import { BrandIdentitySection } from "./sections/brand-identity-section";
import { BrandPersonalitySection } from "./sections/brand-personality-section";
import { BrandProductsSection } from "./sections/brand-products-section";
import { BrandSocialSection } from "./sections/brand-social-section";
import { BrandTypographySection } from "./sections/brand-typography-section";
import { BrandValuesSection } from "./sections/brand-values-section";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import Loader from "../loader";

// ============================================================================
// Types
// ============================================================================

export interface BrandKitData {
  // Core identity
  companyName: string | null;
  logo: string | null;
  tagline: string | null;
  companyDescription: string | null;

  // Colors
  primaryColor: string | null;
  accentColor: string | null;
  backgroundColor: string | null;
  textPrimaryColor: string | null;

  // Typography & Layout
  fontFamily: string | null;
  borderRadius: string | null;

  // Personality
  brandVoice: string | null;
  brandTone: string | null;
  brandEnergy: string | null;

  // Company details
  industry: string | null;
  targetAudience: string | null;
  websiteUrl: string | null;
  contactEmail: string | null;
  foundingYear: string | null;

  // Assets
  favicon: string | null;
  ogImage: string | null;

  // Arrays
  productsServices: string[] | null;
  brandValues: string[] | null;
  socialLinks: Record<string, string> | null;

  // AI/Scraped data
  summary: string | null;
  links: string[] | null;

  // Metadata
  scrapedAt: Date | null;
  scrapeConfidence: number | null;
}

// ============================================================================
// Main Component
// ============================================================================

export function BrandConfigurationModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeOrganization, refreshOrganizations } = useOrganization();

  const isOpen = searchParams.get("brand") === "configuration";
  const [activeSection, setActiveSection] = useState<SectionId>("identity");
  const [brandData, setBrandData] = useState<BrandKitData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Refs for scroll-spy
  const sectionRefs = useRef<Record<SectionId, HTMLDivElement | null>>(
    {} as any
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Close modal handler
  const handleClose = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("brand");
    router.replace(`/app?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Reset state when organization changes
  useEffect(() => {
    setBrandData(null);
    setHasChanges(false);
    setActiveSection("identity");
  }, [activeOrganization?.id]);

  // Fetch brand kit data
  useEffect(() => {
    if (isOpen && activeOrganization?.id) {
      setIsLoading(true);
      trpcClient.brandKit.get
        .query({ organizationId: activeOrganization.id })
        .then((data) => {
          if (data) {
            setBrandData({
              companyName: data.companyName,
              logo: data.logo,
              tagline: data.tagline,
              companyDescription: data.companyDescription,
              primaryColor: data.primaryColor,
              accentColor: data.accentColor,
              backgroundColor: data.backgroundColor,
              textPrimaryColor: data.textPrimaryColor,
              fontFamily: data.fontFamily,
              borderRadius: data.borderRadius,
              brandVoice: data.brandVoice,
              brandTone: data.brandTone,
              brandEnergy: data.brandEnergy,
              industry: data.industry,
              targetAudience: data.targetAudience,
              websiteUrl: data.websiteUrl,
              contactEmail: data.contactEmail,
              foundingYear: data.foundingYear,
              favicon: data.favicon,
              ogImage: data.ogImage,
              productsServices: data.productsServices as string[] | null,
              brandValues: data.brandValues as string[] | null,
              socialLinks: data.socialLinks as Record<string, string> | null,
              summary: data.summary,
              links: data.links as string[] | null,
              scrapedAt: data.scrapedAt,
              scrapeConfidence: data.scrapeConfidence,
            });
          }
        })
        .catch((error) => {
          console.error("Failed to fetch brand kit:", error);
          toast.error("Failed to load brand settings");
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, activeOrganization?.id]);

  // Scroll spy effect
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute(
              "data-section"
            ) as SectionId;
            if (sectionId) {
              setActiveSection(sectionId);
            }
          }
        });
      },
      {
        root: container,
        rootMargin: "-100px 0px -50% 0px",
        threshold: 0,
      }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [brandData]);

  // Scroll to section when clicking nav
  const scrollToSection = useCallback((sectionId: SectionId) => {
    const element = sectionRefs.current[sectionId];
    if (element && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const elementTop = element.offsetTop;
      const offset = 20; // Small offset from top

      container.scrollTo({
        top: elementTop - offset,
        behavior: "smooth",
      });
    }
  }, []);

  // Update a section of the brand data
  const updateBrandData = useCallback((updates: Partial<BrandKitData>) => {
    setBrandData((prev) => (prev ? { ...prev, ...updates } : null));
    setHasChanges(true);
  }, []);

  // Save all changes - non-blocking optimistic
  const handleSave = async () => {
    if (!activeOrganization?.id || !brandData) return;

    // Optimistic update - don't block UI
    setIsSaving(true);
    const savingToast = toast.loading("Saving brand settings...");

    try {
      await trpcClient.brandKit.update.mutate({
        organizationId: activeOrganization.id,
        // Identity
        companyName: brandData.companyName ?? undefined,
        logo: brandData.logo ?? undefined,
        tagline: brandData.tagline ?? undefined,
        companyDescription: brandData.companyDescription ?? undefined,
        // Colors
        primaryColor: brandData.primaryColor ?? undefined,
        accentColor: brandData.accentColor ?? undefined,
        backgroundColor: brandData.backgroundColor ?? undefined,
        textPrimaryColor: brandData.textPrimaryColor ?? undefined,
        // Typography
        fontFamily: brandData.fontFamily ?? undefined,
        borderRadius: brandData.borderRadius ?? undefined,
        // Personality
        brandVoice: brandData.brandVoice ?? undefined,
        brandTone: brandData.brandTone ?? undefined,
        brandEnergy: brandData.brandEnergy ?? undefined,
        // Company
        industry: brandData.industry ?? undefined,
        targetAudience: brandData.targetAudience ?? undefined,
        websiteUrl: brandData.websiteUrl ?? undefined,
        contactEmail: brandData.contactEmail ?? undefined,
        foundingYear: brandData.foundingYear ?? undefined,
        // Assets
        favicon: brandData.favicon ?? undefined,
        ogImage: brandData.ogImage ?? undefined,
        // Arrays
        productsServices: brandData.productsServices ?? undefined,
        brandValues: brandData.brandValues ?? undefined,
        socialLinks: brandData.socialLinks ?? undefined,
        // AI/Scraped data
        summary: brandData.summary ?? undefined,
        links: brandData.links ?? undefined,
      });

      toast.success("Brand settings saved successfully", { id: savingToast });
      setHasChanges(false);
      await refreshOrganizations();
    } catch (error) {
      console.error("Failed to save brand kit:", error);
      toast.error("Failed to save brand settings", { id: savingToast });
    } finally {
      setIsSaving(false);
    }
  };

  // All sections config
  const sections = [
    {
      id: "identity" as const,
      Component: BrandIdentitySection,
      title: "Brand Identity",
    },
    {
      id: "colors" as const,
      Component: BrandColorsSection,
      title: "Brand Colors",
    },
    {
      id: "typography" as const,
      Component: BrandTypographySection,
      title: "Typography",
    },
    {
      id: "personality" as const,
      Component: BrandPersonalitySection,
      title: "Brand Personality",
    },
    {
      id: "company" as const,
      Component: BrandCompanySection,
      title: "Company Details",
    },
    {
      id: "social" as const,
      Component: BrandSocialSection,
      title: "Social Links",
    },
    {
      id: "products" as const,
      Component: BrandProductsSection,
      title: "Products & Services",
    },
    {
      id: "values" as const,
      Component: BrandValuesSection,
      title: "Brand Values",
    },
    {
      id: "ai-data" as const,
      Component: BrandAIDataSection,
      title: "AI Scraped Data",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="sm:max-w-full h-screen p-0 gap-0 overflow-hidden rounded-none grid grid-cols-1 grid-rows-[auto_1fr]"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-muted/30 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-end gap-1">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  {isLoading ? (
                    <Skeleton className="h-6 w-40 rounded-full animate-pulse" />
                  ) : (
                    <>
                      {activeOrganization?.logo ? (
                        <Avatar className="h-6 w-6 border border-border rounded-full">
                          <AvatarImage
                            src={activeOrganization.logo}
                            className="object-contain p-1"
                            alt={activeOrganization.name || "Brand Logo"}
                          />
                          <AvatarFallback>
                            {activeOrganization.name?.charAt(0) || "B"}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}
                      {activeOrganization?.name || "Brand Name"}
                    </>
                  )}
                </DialogTitle>
                <DialogDescription className="text-sm font-normal">
                  <Badge className="text-xs font-normal px-2 py-0.5">
                    Brand Kit
                  </Badge>
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex flex-col md:flex-row flex-1 h-full overflow-hidden">
          {/* Sidebar Navigation */}
          <BrandConfigNav
            activeSection={activeSection}
            onNavigate={scrollToSection}
          />

          {/* Main Content Area - Split Layout */}
          <div className="flex-1 flex overflow-hidden border-t md:border-t-0 md:border-x border-border">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <MocahLoadingIcon />
              </div>
            ) : !brandData ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <AlertCircle className="h-8 w-8" />
                  <p className="text-sm">No brand kit found</p>
                  <Button variant="outline" size="sm" onClick={handleClose}>
                    Set up brand
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Left Side - Scrollable Form Content */}
                <div className="flex-1 flex flex-col overflow-hidden relative border-r">
                  <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto pb-24 scroll-smooth"
                  >
                    <div className="space-y-8">
                      {sections.map(({ id, Component, title }, index) => {
                        const props = {
                          data: brandData,
                          onUpdate: updateBrandData,
                          disabled: false, // Non-blocking
                          ...(id === "identity" && {
                            organizationId: activeOrganization?.id,
                          }),
                        };
                        const isLastSection = index === sections.length - 1;

                        return (
                          <div key={id}>
                            <div
                              ref={(el) => {
                                sectionRefs.current[id] = el;
                              }}
                              data-section={id}
                              className="space-y-4"
                            >
                              <Component {...(props as any)} />
                            </div>

                            {/* Visual Divider */}
                            {!isLastSection && (
                              <div className="flex items-center gap-2 justify-between h-1 bg-primary/5 my-8">
                                <div className="w-2 h-2 bg-primary/10 backdrop-blur-sm rounded-full" />

                                <div className="w-2 h-2 bg-primary/10 backdrop-blur-sm rounded-full" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fixed Save Button at Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 px-6 py-4 z-10">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        {hasChanges ? (
                          <span className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                            <AlertCircle className="h-4 w-4" />
                            Unsaved changes
                          </span>
                        ) : isSaving ? (
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-green-600 dark:text-green-500">
                            <Check className="h-4 w-4" />
                            All changes saved
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={handleClose}
                          size="sm"
                        >
                          Close
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={!hasChanges}
                          size="sm"
                        >
                          Save Changes
                          {isSaving ? (
                            <Loader />
                          ) : (
                            null
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Fixed Preview */}
                <div className="hidden lg:flex w-[480px] shrink-0 bg-muted/20 items-center justify-center p-6 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <LiveEmailPreview
                      brand={{
                        brandName: brandData.companyName || undefined,
                        primaryColor: brandData.primaryColor || undefined,
                        accentColor: brandData.accentColor || undefined,
                        backgroundColor: brandData.backgroundColor || undefined,
                        textColor: brandData.textPrimaryColor || undefined,
                        borderRadius: brandData.borderRadius || undefined,
                        fontFamily: brandData.fontFamily || undefined,
                        logo: brandData.logo || undefined,
                        brandVoice: brandData.brandVoice || undefined,
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
