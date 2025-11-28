import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { serverEnv } from "@mocah/config/env";

/**
 * Next.js environment configuration
 * Extends the shared server env from @mocah/config and adds client-side variables
 */
export const env = createEnv({
	extends: [serverEnv],
	client: {
		// Better Auth Client
		NEXT_PUBLIC_BETTER_AUTH_URL: z.url().optional(),
	},
	runtimeEnv: {
		// Client variables (must be manually destructured for Next.js bundling)
		NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
	},
});

