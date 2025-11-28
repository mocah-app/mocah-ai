import type { auth } from "@mocah/auth";
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { stripeClient } from "@better-auth/stripe/client";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { env } from "../env";

export const authClient = createAuthClient({
	baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001",
	plugins: [
		inferAdditionalFields<typeof auth>(),
		organizationClient(),
		stripeClient({
			subscription: true,
		}),
	],
});
