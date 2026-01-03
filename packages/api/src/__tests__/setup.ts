/**
 * API Package Test Setup
 * 
 * This file runs before all tests in the API package.
 * It sets up environment variables and mocks external dependencies.
 */

import { vi, beforeAll, afterEach, afterAll } from "vitest";

// ============================================================================
// Environment Setup (must be first - before any imports that read env vars)
// ============================================================================

// Skip environment validation in tests
process.env.SKIP_ENV_VALIDATION = "1";
process.env.NODE_ENV = "test";

// Set all required environment variables
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/mocah_test";
process.env.BETTER_AUTH_SECRET = "test-secret-key-for-testing-only";
process.env.BETTER_AUTH_URL = "http://localhost:3001";
process.env.STRIPE_SECRET_KEY = "sk_test_mock";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_mock";
process.env.OPENROUTER_API_KEY = "test-openrouter-key";
process.env.TIGRIS_ENDPOINT_URL = "https://test.tigris.dev";
process.env.TIGRIS_ACCESS_KEY_ID = "test-access-key";
process.env.TIGRIS_SECRET_ACCESS_KEY = "test-secret-key";
process.env.TIGRIS_BUCKET_NAME = "test-bucket";
process.env.TIGRIS_PUBLIC_URL = "https://test-public.tigris.dev";
process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";
process.env.RESEND_API_KEY = "test-resend-api-key";
process.env.FAL_API_KEY = "test-fal-api-key";

// ============================================================================
// Module Mocks (hoisted by Vitest)
// ============================================================================

// Mock better-auth packages
vi.mock("better-auth/next-js", () => ({
  nextCookies: vi.fn().mockReturnValue({}),
}));

vi.mock("better-auth", () => ({
  betterAuth: vi.fn().mockReturnValue({
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  }),
}));

vi.mock("better-auth/plugins", () => ({
  organization: vi.fn().mockReturnValue({}),
  twoFactor: vi.fn().mockReturnValue({}),
}));

// Mock @mocah/auth module
vi.mock("@mocah/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
    $Infer: {
      Session: {} as any,
    },
  },
}));

// Mock @mocah/auth/stripe-sync
vi.mock("@mocah/auth/stripe-sync", () => ({
  cachedStripeInvoicesList: vi.fn().mockResolvedValue({ data: [] }),
}));

// Mock @mocah/db module
vi.mock("@mocah/db", () => ({
  default: {},
}));

// Mock @mocah/config/env - provide mock env values
vi.mock("@mocah/config/env", () => ({
  serverEnv: {
    DATABASE_URL: "postgresql://test:test@localhost:5432/mocah_test",
    BETTER_AUTH_SECRET: "test-secret",
    BETTER_AUTH_URL: "http://localhost:3001",
    STRIPE_SECRET_KEY: "sk_test_mock",
    STRIPE_WEBHOOK_SECRET: "whsec_test_mock",
    OPENROUTER_API_KEY: "test-openrouter-key",
    TIGRIS_ENDPOINT_URL: "https://test.tigris.dev",
    TIGRIS_ACCESS_KEY_ID: "test-access-key",
    TIGRIS_SECRET_ACCESS_KEY: "test-secret-key",
    TIGRIS_BUCKET_NAME: "test-bucket",
    TIGRIS_PUBLIC_URL: "https://test-public.tigris.dev",
    GOOGLE_CLIENT_ID: "test-google-client-id",
    GOOGLE_CLIENT_SECRET: "test-google-client-secret",
    RESEND_API_KEY: "test-resend-api-key",
    FAL_API_KEY: "test-fal-api-key",
    NODE_ENV: "test",
  },
}));

// Mock Stripe - must be a class constructor
vi.mock("stripe", () => {
  const MockStripe = vi.fn().mockImplementation(() => ({
    subscriptions: {
      update: vi.fn().mockResolvedValue({}),
    },
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: "https://stripe.com/portal" }),
      },
    },
  }));
  return { default: MockStripe, Stripe: MockStripe };
});

// Mock @mocah/shared/logger
vi.mock("@mocah/shared/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock @mocah/shared
vi.mock("@mocah/shared", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ============================================================================
// MSW Server Setup (for integration tests)
// ============================================================================

// Import MSW server after mocks are set up
import { server } from "../test-utils/mocks/server";

beforeAll(() => {
  // Start MSW server to intercept external HTTP requests
  server.listen({ onUnhandledRequest: "bypass" });
});

afterEach(() => {
  // Reset handlers between tests
  server.resetHandlers();
});

afterAll(() => {
  // Clean up MSW server
  server.close();
});
