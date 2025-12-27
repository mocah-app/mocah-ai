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
    // Starter Plan:
    STRIPE_PRICE_ID_STARTER_MONTHLY: z.string().optional(),
    STRIPE_PRICE_ID_STARTER_ANNUAL: z.string().optional(),
    // Pro Plan:
    STRIPE_PRICE_ID_PRO_MONTHLY: z.string().optional(),
    STRIPE_PRICE_ID_PRO_ANNUAL: z.string().optional(),
    // Scale Plan:
    STRIPE_PRICE_ID_SCALE_MONTHLY: z.string().optional(),
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

    // Fal AI (Image Generation)
    FAL_API_KEY: z.string().min(1),
    FAL_BASE_URL: z.url().optional(),
    FAL_IMAGE_MODEL: z.string().optional(), // Text-to-image model
    FAL_IMAGE_EDIT_MODEL: z.string().optional(), // Image-to-image editing model
    FAL_IMAGE_RATE_PER_MINUTE: z.coerce.number().optional(),
    FAL_IMAGE_RATE_PER_DAY: z.coerce.number().optional(),
    FAL_IMAGE_ENABLED: z.coerce.boolean().optional(),

    // Template Library Publishing
    TEMPLATE_PUBLISHER_EMAILS: z.string().optional(), // Comma-separated emails allowed to publish
    APIFLASH_API_KEY: z.string().optional(), // ApiFlash screenshot API key

    // Node Environment
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION && process.env.NODE_ENV !== "production",
});
