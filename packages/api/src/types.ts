import type { auth } from "@mocah/auth";
import type { PrismaClient } from "@mocah/db";

/**
 * Inferred types from auth and database
 */
type SessionResult = Awaited<ReturnType<typeof auth.api.getSession>>;

/**
 * Type for organization with included relations
 */
export type OrganizationWithRelations = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  metadata: unknown;
  createdAt: Date;
  brandKit: {
    id: string;
    organizationId: string;
    primaryColor: string | null;
    secondaryColor: string | null;
    accentColor: string | null;
    fontFamily: string | null;
    brandVoice: string | null;
    logo: string | null;
    favicon: string | null;
    customCss: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  } | null;
  members: Array<{
    id: string;
    userId: string;
    organizationId: string;
    role: string;
    createdAt: Date;
  }>;
};

/**
 * API Context type
 */
export interface ApiContext {
  session: SessionResult;
  db: PrismaClient;
  activeOrganization: OrganizationWithRelations | null;
}

/**
 * Extended context with organization guarantee
 */
export interface OrganizationContext extends ApiContext {
  organizationId: string;
  organization: NonNullable<OrganizationWithRelations>;
}
