"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { logger } from "@mocah/shared";
import type {
  Organization,
  CreateOrgInput,
  UpdateOrgInput,
  OrganizationMetadata,
} from "@/types/organization";

interface OrganizationContextValue {
  // Active organization
  activeOrganization: Organization | null;

  // All user's organizations
  organizations: Organization[];

  // Loading states
  isLoading: boolean;

  // Actions
  setActiveOrganization: (orgId: string) => Promise<void>;
  createOrganization: (data: CreateOrgInput) => Promise<Organization | null>;
  updateOrganization: (orgId: string, data: UpdateOrgInput) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(
  null
);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [activeOrganization, setActiveOrgState] = useState<Organization | null>(
    null
  );
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's organizations on mount
  useEffect(() => {
    if (session?.user && !sessionLoading) {
      loadOrganizations();
    } else if (!sessionLoading && !session?.user) {
      setIsLoading(false);
    }
  }, [session, sessionLoading]);

  const loadOrganizations = async () => {
    setIsLoading(true);
    try {
      // Use tRPC to load organizations
      const orgs = await trpc.organization.list.query();

      setOrganizations(orgs as Organization[]);

      // Get active organization from session
      if (session?.session?.activeOrganizationId) {
        const activeOrg = orgs?.find(
          (o: any) => o.id === session.session.activeOrganizationId
        );
        setActiveOrgState((activeOrg as Organization) || null);
      } else if (orgs && orgs.length > 0) {
        // Auto-set first org as active if none set
        await setActiveOrganization(orgs[0].id);
      }
    } catch (error) {
      logger.error(
        "Failed to load organizations",
        {
          component: "OrganizationContext",
          action: "loadOrganizations",
        },
        error as Error
      );
      toast.error("Failed to load workspaces");
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const setActiveOrganization = async (orgId: string) => {
    try {
      const { error } = await authClient.organization.setActive({
        organizationId: orgId,
      });

      if (error) {
        throw error;
      }

      const org = organizations.find((o: Organization) => o.id === orgId);
      setActiveOrgState(org || null);
      toast.success(`Switched to ${org?.name}`);
    } catch (error: any) {
      logger.error(
        "Failed to set active organization",
        {
          component: "OrganizationContext",
          action: "setActiveOrganization",
          organizationId: orgId,
        },
        error
      );
      toast.error(error.message || "Failed to switch workspace");
      throw error;
    }
  };

  const createOrganization = async (
    data: CreateOrgInput
  ): Promise<Organization | null> => {
    try {
      const { data: newOrg, error } = await authClient.organization.create({
        name: data.name,
        slug: data.slug,
        logo: data.logo,
        metadata: data.metadata,
      });

      if (error) {
        throw new Error(error.message || "Failed to create workspace");
      }

      if (!newOrg) {
        throw new Error("No organization returned");
      }

      // Refresh list and set as active
      await loadOrganizations();

      toast.success(`Created ${data.name}`);
      return newOrg;
    } catch (error: any) {
      logger.error(
        "Failed to create organization",
        {
          component: "OrganizationContext",
          action: "createOrganization",
          organizationName: data.name,
        },
        error
      );
      toast.error(error.message || "Failed to create workspace");
      throw error;
    }
  };

  const updateOrganization = async (
    orgId: string,
    data: UpdateOrgInput
  ): Promise<void> => {
    try {
      // Build update payload
      const updatePayload: {
        name?: string;
        slug?: string;
        logo?: string;
        metadata?: Record<string, any>;
      } = {};

      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.slug !== undefined) updatePayload.slug = data.slug;
      if (data.logo !== undefined) updatePayload.logo = data.logo;
      if (data.metadata !== undefined) {
        // Ensure metadata is always an object (Better Auth handles JSON serialization)
        updatePayload.metadata = data.metadata;
      }

      logger.debug("Updating organization", {
        component: "OrganizationContext",
        action: "updateOrganization",
        organizationId: orgId,
        name: updatePayload.name,
        slug: updatePayload.slug,
        hasLogo: !!updatePayload.logo,
        metadataType: typeof updatePayload.metadata,
        metadataKeys: updatePayload.metadata
          ? Object.keys(updatePayload.metadata)
          : [],
        metadataPreview: updatePayload.metadata,
      });

      const { error } = await authClient.organization.update({
        organizationId: orgId,
        data: updatePayload,
      });

      if (error) {
        logger.error("Better Auth update error", {
          component: "OrganizationContext",
          action: "updateOrganization",
          error: error,
        });
        throw new Error(error.message || "Failed to update workspace");
      }

      logger.info("Organization updated successfully", {
        component: "OrganizationContext",
        action: "updateOrganization",
        organizationId: orgId,
      });

      // Refresh organizations list
      await loadOrganizations();
    } catch (error: any) {
      logger.error(
        "Failed to update organization",
        {
          component: "OrganizationContext",
          action: "updateOrganization",
          organizationId: orgId,
        },
        error
      );
      toast.error(error.message || "Failed to update workspace");
      throw error;
    }
  };

  return (
    <OrganizationContext.Provider
      value={{
        activeOrganization,
        organizations,
        isLoading: isLoading || sessionLoading,
        setActiveOrganization,
        createOrganization,
        updateOrganization,
        refreshOrganizations: loadOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return context;
}
