import { vi } from "vitest";
import type { ApiContext, Session, OrganizationWithRelations } from "../types";
import { mockDeep, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@mocah/db";

/**
 * Create a mock Prisma client for testing
 */
export function createMockDb(): DeepMockProxy<PrismaClient> {
  return mockDeep<PrismaClient>();
}

/**
 * Create a mock session for testing
 */
export function createMockSession(overrides: Partial<MockSessionData> = {}): Session {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

  return {
    user: {
      id: overrides.userId ?? "test-user-id",
      email: overrides.email ?? "test@example.com",
      name: overrides.name ?? "Test User",
      emailVerified: overrides.emailVerified ?? true,
      image: overrides.image ?? null,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
    },
    session: {
      id: overrides.sessionId ?? "test-session-id",
      userId: overrides.userId ?? "test-user-id",
      token: overrides.token ?? "test-session-token",
      expiresAt: overrides.expiresAt ?? expiresAt,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
      ipAddress: overrides.ipAddress ?? "127.0.0.1",
      userAgent: overrides.userAgent ?? "vitest",
      activeOrganizationId: overrides.activeOrganizationId ?? null,
    },
  } as Session;
}

interface MockSessionData {
  userId: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image: string | null;
  sessionId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress: string;
  userAgent: string;
  activeOrganizationId: string | null;
}

/**
 * Create a mock organization for testing
 */
export function createMockOrganization(overrides: Partial<MockOrganizationData> = {}): OrganizationWithRelations {
  const now = new Date();
  const orgId = overrides.id ?? "test-org-id";
  const userId = overrides.userId ?? "test-user-id";

  return {
    id: orgId,
    name: overrides.name ?? "Test Organization",
    slug: overrides.slug ?? "test-org",
    logo: overrides.logo ?? null,
    metadata: overrides.metadata ?? {},
    createdAt: overrides.createdAt ?? now,
    brandKit: overrides.brandKit ?? null,
    members: overrides.members ?? [
      {
        id: "test-member-id",
        userId,
        organizationId: orgId,
        role: "owner",
        createdAt: now,
      },
    ],
  };
}

interface MockOrganizationData {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  metadata: unknown;
  createdAt: Date;
  userId: string;
  brandKit: OrganizationWithRelations["brandKit"];
  members: OrganizationWithRelations["members"];
}

/**
 * Create a test context for tRPC procedures
 */
export function createTestContext(overrides: Partial<TestContextOptions> = {}): ApiContext {
  const db = overrides.db ?? createMockDb();
  const session = overrides.session === null ? null : (overrides.session ?? createMockSession());
  const activeOrganization = overrides.activeOrganization === null 
    ? null 
    : (overrides.activeOrganization ?? null);

  return {
    db: db as unknown as PrismaClient,
    session,
    activeOrganization,
  };
}

interface TestContextOptions {
  db: DeepMockProxy<PrismaClient>;
  session: Session | null;
  activeOrganization: OrganizationWithRelations | null;
}

/**
 * Create a protected test context (with authenticated session)
 */
export function createProtectedTestContext(overrides: Partial<TestContextOptions> = {}): ApiContext {
  return createTestContext({
    ...overrides,
    session: overrides.session ?? createMockSession(),
  });
}

/**
 * Create an organization test context (with session and active organization)
 */
export function createOrgTestContext(overrides: Partial<TestContextOptions> = {}): ApiContext {
  const userId = "test-user-id";
  const session = overrides.session ?? createMockSession({ userId });
  const activeOrganization = overrides.activeOrganization ?? createMockOrganization({ userId });

  return createTestContext({
    ...overrides,
    session,
    activeOrganization,
  });
}

