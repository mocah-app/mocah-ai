"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useOrganization } from "@/contexts/organization-context";
import { logger } from "@mocah/shared";
import type { OrganizationMetadata } from "@/types/organization";
import { trpcClient } from "@/utils/trpc";
import { fileToApiFormat, validateImageFile } from "@/lib/file-utils";
import { LiveEmailPreview } from "@/components/onboarding/live-email-preview";
import { toast } from "sonner";
import {
  BrandForm,
  type BrandFormValues,
  type BrandFormData,
} from "@/components/brand-kit/brand-form";

export function BrandSettingsForm() {
  const { activeOrganization, refreshOrganizations } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<BrandFormData | null>(null);
  const [resetCounter, setResetCounter] = useState(0);
  const [defaultValues, setDefaultValues] = useState<Partial<BrandFormValues>>({
    brandName: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#10B981",
    fontFamily: "Arial, sans-serif",
    brandVoice: "professional",
    logo: "",
  });
  const [originalValues, setOriginalValues] = useState<
    Partial<BrandFormValues>
  >({
    brandName: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#10B981",
    fontFamily: "Arial, sans-serif",
    brandVoice: "professional",
    logo: "",
  });

  // Update form when active organization changes
  useEffect(() => {
    if (activeOrganization) {
      // Prefer brandKit data over metadata (brandKit is the source of truth)
      const brandKit = activeOrganization.brandKit;

      const values = {
        brandName: activeOrganization.name,
        primaryColor: brandKit?.primaryColor || "#3B82F6",
        secondaryColor: brandKit?.secondaryColor || "#10B981",
        fontFamily: brandKit?.fontFamily || "Arial, sans-serif",
        brandVoice: (brandKit?.brandVoice as any) || "professional",
        logo: brandKit?.logo || activeOrganization.logo || "",
      };

      setDefaultValues(values);
      setOriginalValues(values);
    }
  }, [
    activeOrganization?.id,
    activeOrganization?.brandKit,
    activeOrganization?.name,
    activeOrganization?.logo,
  ]);

  // tRPC mutations
  const uploadLogoMutation = useMutation({
    mutationFn: (data: { file: any; organizationId: string }) =>
      trpcClient.storage.uploadLogo.mutate(data),
    onError: (error: Error) => {
      logger.error(
        "Failed to upload logo",
        {
          component: "BrandSettingsForm",
          action: "uploadLogo",
          organizationId: activeOrganization?.id,
        },
        error
      );
      toast.error(error.message || "Failed to upload logo");
    },
  });

  const updateOrganizationMutation = useMutation({
    mutationFn: (data: {
      organizationId: string;
      organization: {
        name?: string;
        slug?: string;
        logo?: string;
        metadata?: Record<string, any>;
      };
      brandKit: {
        primaryColor?: string;
        secondaryColor?: string;
        fontFamily?: string;
        brandVoice?: string;
        logo?: string;
      };
    }) => trpcClient.organization.updateWithBrandKit.mutate(data),
    onSuccess: () => {
      logger.info("Brand settings updated successfully", {
        component: "BrandSettingsForm",
        action: "updateBrandSettings",
        organizationId: activeOrganization?.id,
      });
      toast.success("Brand settings updated successfully!");
    },
    onError: (error: Error) => {
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
    },
  });

  async function onSubmit(values: BrandFormValues, logoFile: File | null) {
    if (!activeOrganization) {
      toast.error("No active organization");
      return;
    }

    setIsLoading(true);
    try {
      // Upload logo if new file was selected
      let logoUrl = values.logo;
      if (logoFile) {
        // Validate file
        const validation = validateImageFile(logoFile);
        if (!validation.valid) {
          toast.error(validation.error);
          setIsLoading(false);
          return;
        }

        // Convert file to API format
        const fileData = await fileToApiFormat(logoFile);

        const uploadResult = await uploadLogoMutation.mutateAsync({
          file: fileData,
          organizationId: activeOrganization.id,
        });
        logoUrl = uploadResult.url;
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
      if (typeof activeOrganization.metadata === "string") {
        try {
          existingMetadata = JSON.parse(activeOrganization.metadata);
        } catch (error) {
          logger.error(
            "Failed to parse metadata",
            { component: "BrandSettingsForm" },
            error as Error
          );
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

      logger.debug("Submitting brand settings update", {
        component: "BrandSettingsForm",
        action: "onSubmit",
        organizationId: activeOrganization.id,
        metadata: metadata,
      });

      // Update organization and brand kit in a single transaction via tRPC
      await updateOrganizationMutation.mutateAsync({
        organizationId: activeOrganization.id,
        organization: {
          name: values.brandName,
          slug: slug,
          logo: logoUrl,
          metadata: metadata,
        },
        brandKit: {
          primaryColor: values.primaryColor,
          secondaryColor: values.secondaryColor,
          fontFamily: values.fontFamily,
          brandVoice: values.brandVoice,
          logo: logoUrl,
        },
      });

      // Update originalValues to the newly saved values
      setOriginalValues({
        brandName: values.brandName,
        primaryColor: values.primaryColor,
        secondaryColor: values.secondaryColor,
        fontFamily: values.fontFamily,
        brandVoice: values.brandVoice,
        logo: logoUrl,
      });

      // Refresh organizations list to get updated data
      await refreshOrganizations();
    } catch (error: any) {
      // Error handling is done in mutation callbacks
      logger.error(
        "Failed to update brand settings",
        {
          component: "BrandSettingsForm",
          action: "updateBrandSettings",
          organizationId: activeOrganization?.id,
        },
        error
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-2">
      <BrandForm
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        onFormChange={setFormData}
        isLoading={isLoading}
        submitButtonText="Update Brand"
        submitButtonLoadingText="Updating..."
        showSecondaryButton={true}
        secondaryButtonText="Reset"
        onSecondaryButtonClick={() => {
          setDefaultValues({ ...originalValues });
          setResetCounter((prev) => prev + 1);
        }}
        title="Brand Settings"
        description="Customize your brand identity."
        showAvatar={true}
        organizationName={activeOrganization?.name}
        formKey={`${activeOrganization?.id}-${resetCounter}`}
        activeOrganization={activeOrganization}
        disableWhenNoOrg={true}
      />

      {/* Right Side - Live Preview */}
      <div className="hidden lg:block bg-card p-6 shadow-2xl">
        <LiveEmailPreview
          brand={{
            brandName: formData?.values.brandName || activeOrganization?.name,
            primaryColor:
              formData?.values.primaryColor ||
              defaultValues.primaryColor ||
              "#3B82F6",
            secondaryColor:
              formData?.values.secondaryColor || defaultValues.secondaryColor,
            fontFamily:
              formData?.values.fontFamily ||
              defaultValues.fontFamily ||
              "Arial, sans-serif",
            logo:
              formData !== null
                ? formData.logoPreview || undefined
                : activeOrganization?.logo || undefined,
            brandVoice:
              formData?.values.brandVoice ||
              defaultValues.brandVoice ||
              "professional",
          }}
        />
      </div>
    </div>
  );
}
