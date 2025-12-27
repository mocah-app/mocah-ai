"use client";

import { BrandSettingsTab } from "@/components/settings/brand-settings-tab";
import { BillingSettingsTab } from "@/components/settings/billing-settings-tab";
import { SettingsNav, type SectionId } from "@/components/settings/settings-nav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOrganization } from "@/contexts/organization-context";
import { useAuth } from "@/lib/use-auth";
import { Settings2, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import MocahLoadingIcon from "../mocah-brand/MocahLoadingIcon";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";

export function SettingsModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeOrganization, isLoading: orgLoading } = useOrganization();
  const { isLoading: authLoading } = useAuth();

  const isOpen = searchParams.get("settings") === "open";
  const [activeSection, setActiveSection] = useState<SectionId>(
    (searchParams.get("tab") as SectionId) || "brand"
  );

  // Refs for scroll-spy
  const sectionRefs = useRef<Record<SectionId, HTMLDivElement | null>>(
    {} as any
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Close modal handler
  const handleClose = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("settings");
    params.delete("tab");
    router.replace(`/app?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Handle section navigation
  const handleSectionChange = useCallback(
    (sectionId: SectionId) => {
      setActiveSection(sectionId);
      const params = new URLSearchParams(searchParams.toString());
      params.set("settings", "open");
      params.set("tab", sectionId);
      router.replace(`/app?${params.toString()}`, { scroll: false });

      // Scroll to section
      const element = sectionRefs.current[sectionId];
      if (element && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const elementTop = element.offsetTop;
        const offset = 20;

        container.scrollTo({
          top: elementTop - offset,
          behavior: "smooth",
        });
      }
    },
    [router, searchParams]
  );

  // Update active section from URL
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      (tabParam === "brand" || tabParam === "notifications" || tabParam === "billing")
    ) {
      setActiveSection(tabParam as SectionId);
    }
  }, [searchParams]);

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
  }, []);

  const isLoading = orgLoading || authLoading;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="sm:max-w-full h-dvh p-0 gap-0 overflow-hidden rounded-none grid grid-cols-1 grid-rows-[auto_1fr]"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="px-6 flex flex-row items-center justify-between h-auto py-4 border-b shrink-0">
          <div className="flex items-end gap-1">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {isLoading ? (
                <Skeleton className="h-6 w-40 rounded-full animate-pulse" />
              ) : (
                <>
                  <Settings2 className="h-5 w-5" />
                  Settings
                </>
              )}
            </DialogTitle>
            {activeOrganization && (
              <DialogDescription className="text-sm font-normal">
                <Badge className="text-xs font-normal px-2 py-0.5">
                  {activeOrganization.name || "Workspace"}
                </Badge>
              </DialogDescription>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* Content */}
        <div className="flex flex-col md:flex-row flex-1 h-full overflow-hidden">
          {/* Sidebar Navigation */}
          <SettingsNav
            activeSection={activeSection}
            onNavigate={handleSectionChange}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden border-t md:border-t-0 md:border-x border-border">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <MocahLoadingIcon />
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden relative">
                <div
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto pb-24 scroll-smooth px-6 py-6"
                >
                  <div className="space-y-8 max-w-2xl border border-border">
                    {/* Brand Settings Section */}
                    <div
                      ref={(el) => {
                        sectionRefs.current.brand = el;
                      }}
                      data-section="brand"
                      className="space-y-4"
                    >
                      <BrandSettingsTab onClose={handleClose} />
                    </div>

                    {/* Visual Divider */}
                    <div className="flex items-center gap-2 justify-between h-1 bg-primary/5 my-8">
                      <div className="w-2 h-2 bg-primary/10 backdrop-blur-sm rounded-full" />
                      <div className="w-2 h-2 bg-primary/10 backdrop-blur-sm rounded-full" />
                    </div>

                    {/* Notifications Section */}
                    <div
                      ref={(el) => {
                        sectionRefs.current.notifications = el;
                      }}
                      data-section="notifications"
                      className="space-y-4"
                    >
                      <Card className="rounded-none border-none">
                        <CardHeader>
                          <CardTitle>Notification Preferences</CardTitle>
                          <CardDescription>
                            Configure how you receive updates and alerts
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">
                            Notification settings coming soon...
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Visual Divider */}
                    <div className="flex items-center gap-2 justify-between h-1 bg-primary/5 my-8">
                      <div className="w-2 h-2 bg-primary/10 backdrop-blur-sm rounded-full" />
                      <div className="w-2 h-2 bg-primary/10 backdrop-blur-sm rounded-full" />
                    </div>

                    {/* Billing Section */}
                    <div
                      ref={(el) => {
                        sectionRefs.current.billing = el;
                      }}
                      data-section="billing"
                      className="space-y-4"
                    >
                      <BillingSettingsTab onClose={handleClose} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
