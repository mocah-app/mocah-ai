/**
 * Test Caller Factory
 * 
 * Creates tRPC callers for testing routers with proper mocking.
 * Uses the createCallerFactory pattern for type-safe testing.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import type { ApiContext, Session, OrganizationWithRelations } from "../types";
import { mockDeep, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@mocah/db";

// Create a test-specific tRPC instance
const t = initTRPC.context<ApiContext>().create();

export const testRouter = t.router;
export const testPublicProcedure = t.procedure;
export const testProtectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session as Session,
    },
  });
});

/**
 * Create a mock Prisma client
 */
export function createMockPrisma(): DeepMockProxy<PrismaClient> {
  return mockDeep<PrismaClient>();
}

/**
 * Create a mock session
 */
export function createMockSession(overrides: Partial<{
  userId: string;
  email: string;
  name: string;
  activeOrganizationId: string | null;
}> = {}): Session {
  const now = new Date();
  const userId = overrides.userId ?? "test-user-id";
  
  return {
    user: {
      id: userId,
      email: overrides.email ?? "test@mocah.io",
      name: overrides.name ?? "Test User",
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    },
    session: {
      id: "test-session-id",
      userId,
      token: "test-token",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
      activeOrganizationId: overrides.activeOrganizationId ?? null,
    },
  } as Session;
}

/**
 * Create a mock organization
 */
export function createMockOrganization(overrides: Partial<{
  id: string;
  name: string;
  slug: string;
  userId: string;
}> = {}): OrganizationWithRelations {
  const orgId = overrides.id ?? "test-org-id";
  const userId = overrides.userId ?? "test-user-id";
  
  return {
    id: orgId,
    name: overrides.name ?? "Test Organization",
    slug: overrides.slug ?? "test-org",
    logo: null,
    metadata: {},
    createdAt: new Date(),
    brandKit: null,
    members: [{
      id: "test-member-id",
      userId,
      organizationId: orgId,
      role: "owner",
      createdAt: new Date(),
    }],
  };
}

/**
 * Test context builder with fluent API
 */
export class TestContextBuilder {
  private _db: DeepMockProxy<PrismaClient>;
  private _session: Session | null = null;
  private _activeOrganization: OrganizationWithRelations | null = null;

  constructor() {
    this._db = createMockPrisma();
  }

  /**
   * Set authenticated user
   */
  withUser(overrides?: Parameters<typeof createMockSession>[0]): this {
    this._session = createMockSession(overrides);
    return this;
  }

  /**
   * Set active organization
   */
  withOrganization(overrides?: Parameters<typeof createMockOrganization>[0]): this {
    const userId = this._session?.user.id ?? "test-user-id";
    this._activeOrganization = createMockOrganization({ userId, ...overrides });
    
    // Update session with org ID if we have a session
    if (this._session) {
      this._session = createMockSession({
        userId: this._session.user.id,
        email: this._session.user.email,
        name: this._session.user.name,
        activeOrganizationId: this._activeOrganization.id,
      });
    }
    return this;
  }

  /**
   * Get the mock database for setting up expectations
   */
  get db(): DeepMockProxy<PrismaClient> {
    return this._db;
  }

  /**
   * Build the test context
   */
  build(): ApiContext {
    return {
      db: this._db as unknown as PrismaClient,
      session: this._session,
      activeOrganization: this._activeOrganization,
    };
  }
}

/**
 * Create a new test context builder
 */
export function testContext(): TestContextBuilder {
  return new TestContextBuilder();
}

