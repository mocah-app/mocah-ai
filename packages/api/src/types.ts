import type { auth } from "@mocah/auth";
import type { PrismaClient } from "@mocah/db";

/**
 * Inferred session type from Better Auth
 * @see https://www.better-auth.com/docs/concepts/typescript#inferring-types
 */
export type Session = typeof auth.$Infer.Session;

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
  session: Session | null;
  db: PrismaClient;
  activeOrganization: OrganizationWithRelations | null;
}

/**
 * Protected context with guaranteed session
 */
export interface ProtectedContext extends ApiContext {
  session: Session;
}

/**
 * Extended context with organization guarantee
 */
export interface OrganizationContext extends ProtectedContext {
  organizationId: string;
  organization: NonNullable<OrganizationWithRelations>;
}
