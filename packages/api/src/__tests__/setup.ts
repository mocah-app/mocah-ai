import { vi } from "vitest";

// Mock environment variables for testing
vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/mocah_test");
vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-key-for-testing-only");
vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3001");
vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_mock");
vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test_mock");
vi.stubEnv("OPENROUTER_API_KEY", "test-openrouter-key");
vi.stubEnv("TIGRIS_ENDPOINT_URL", "https://test.tigris.dev");
vi.stubEnv("TIGRIS_ACCESS_KEY_ID", "test-access-key");
vi.stubEnv("TIGRIS_SECRET_ACCESS_KEY", "test-secret-key");
vi.stubEnv("TIGRIS_BUCKET_NAME", "test-bucket");
vi.stubEnv("TIGRIS_PUBLIC_URL", "https://test-public.tigris.dev");

