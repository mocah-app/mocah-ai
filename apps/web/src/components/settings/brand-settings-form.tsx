"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useOrganization } from "@/contexts/organization-context";
import { logger } from "@mocah/shared";
import type { OrganizationMetadata } from "@/types/organization";
import { trpc } from "@/utils/trpc";
import { fileToApiFormat, validateImageFile } from "@/lib/file-utils";
import { LiveEmailPreview } from "@/components/onboarding/live-email-preview";
import { toast } from "sonner";
import {
  BrandForm,
  type BrandFormValues,
  type BrandFormData,
} from "@/components/brand/brand-form";

export function BrandSettingsForm() {
  const { activeOrganization, refreshOrganizations } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<BrandFormData | null>(null);
  const [defaultValues, setDefaultValues] = useState<Partial<BrandFormValues>>({
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
      // Parse metadata if it's a string from Better Auth
      let metadata: any = {};
      if (typeof activeOrganization.metadata === "string") {
        try {
          metadata = JSON.parse(activeOrganization.metadata);
        } catch (error) {
          logger.error(
            "Failed to parse metadata",
            { component: "BrandSettingsForm" },
            error as Error
          );
        }
      } else {
        metadata = activeOrganization.metadata || {};
      }

      setDefaultValues({
        brandName: activeOrganization.name,
        primaryColor: metadata.primaryColor || "#3B82F6",
        secondaryColor: metadata.secondaryColor || "#10B981",
        fontFamily: metadata.fontFamily || "Arial, sans-serif",
        brandVoice: metadata.brandVoice || "professional",
        logo: activeOrganization.logo || "",
      });
    }
  }, [
    activeOrganization?.id,
    activeOrganization?.metadata,
    activeOrganization?.name,
    activeOrganization?.logo,
  ]);

  // tRPC mutations
  const uploadLogoMutation = useMutation({
    mutationFn: (data: { file: any; organizationId: string }) =>
      trpc.storage.uploadLogo.mutate(data),
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
    }) => trpc.organization.updateWithBrandKit.mutate(data),
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
        submitButtonText="Save Changes"
        submitButtonLoadingText="Saving..."
        showSecondaryButton={true}
        secondaryButtonText="Reset"
        onSecondaryButtonClick={() => setDefaultValues({ ...defaultValues })}
        title="Brand Settings"
        description="Customize your brand identity."
        showAvatar={true}
        organizationName={activeOrganization?.name}
        formKey={activeOrganization?.id}
        activeOrganization={activeOrganization}
        disableWhenNoOrg={true}
      />

      {/* Right Side - Live Preview */}
      <div className="hidden lg:block bg-card p-6 shadow-2xl">
        <LiveEmailPreview
          brand={{
            brandName:
              formData?.values.brandName || activeOrganization?.name,
            primaryColor:
              formData?.values.primaryColor ||
              defaultValues.primaryColor ||
              "#3B82F6",
            secondaryColor:
              formData?.values.secondaryColor ||
              defaultValues.secondaryColor,
            fontFamily:
              formData?.values.fontFamily ||
              defaultValues.fontFamily ||
              "Arial, sans-serif",
            logo:
              formData?.logoPreview ||
              activeOrganization?.logo ||
              undefined,
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
