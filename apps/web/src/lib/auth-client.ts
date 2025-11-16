import type { auth } from "@mocah/auth";
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { stripeClient } from "@better-auth/stripe/client";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
	plugins: [
		inferAdditionalFields<typeof auth>(),
		organizationClient(),
		stripeClient({
			subscription: true,
		}),
	],
});
