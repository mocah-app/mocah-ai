import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Shared environment variable schema for server-side packages
 * This can be used by packages (api, auth, db) that need validated env vars
 * The web app extends this with Next.js-specific configuration
 */
export const serverEnv = createEnv({
  server: {
    // Database
    DATABASE_URL: z.url(),

    // OpenRouter AI
    OPENROUTER_API_KEY: z.string().min(1),
    OPENROUTER_DEFAULT_MODEL: z.string().optional(),
    OPENROUTER_TEMPLATE_MODEL: z.string().optional(),

    // Tigris S3 Storage
    TIGRIS_ENDPOINT_URL: z.url(),
    TIGRIS_ACCESS_KEY_ID: z.string().min(1),
    TIGRIS_SECRET_ACCESS_KEY: z.string().min(1),
    TIGRIS_BUCKET_NAME: z.string().min(1),
    TIGRIS_PUBLIC_URL: z.string().optional(),

    // Stripe
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    STRIPE_PRICE_ID_FREE: z.string().optional(),
    STRIPE_PRICE_ID_STARTER: z.string().optional(),
    STRIPE_PRICE_ID_PRO: z.string().optional(),
    STRIPE_PRICE_ID_PRO_ANNUAL: z.string().optional(),
    STRIPE_PRICE_ID_SCALE: z.string().optional(),
    STRIPE_PRICE_ID_SCALE_ANNUAL: z.string().optional(),

    // Better Auth
    CORS_ORIGIN: z.url().optional(),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),

    // Email (Resend)
    RESEND_API_KEY: z.string().min(1),
    RESEND_FROM_EMAIL: z.email().optional(),
    APP_NAME: z.string().optional(),
    EMAIL_LOGO_URL: z.url().optional(),

    // Redis (Upstash)
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

    // Firecrawl (Brand Scraping)
    FIRECRAWL_API_KEY: z.string().optional(),

    // Node Environment
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION && process.env.NODE_ENV !== "production",
});
