import type { NextRequest } from "next/server";
import { auth } from "@mocah/auth";
import prisma from "@mocah/db";
import type { ApiContext, OrganizationWithRelations } from "./types";

export async function createContext(req: NextRequest): Promise<ApiContext> {
	const session = await auth.api.getSession({
		headers: req.headers,
	});

	// Add Prisma client to context
	const db = prisma;

	// Get active organization if user is authenticated
	let activeOrganization: OrganizationWithRelations | null = null;
	if (session?.session) {
		// @ts-expect-error - Better Auth organization plugin extends session with activeOrganizationId
		const activeOrgId = session.session.activeOrganizationId as string | undefined;
		
		if (activeOrgId) {
			try {
				const org = await db.organization.findUnique({
					where: { id: activeOrgId },
					include: {
						brandKit: true,
						members: {
							where: { userId: session.user.id },
						},
					},
				});

				// Verify user is actually a member
				if (org && org.members.length > 0) {
					activeOrganization = org as OrganizationWithRelations;
				}
			} catch (error) {
				activeOrganization = null;
			}
		}
	}

	return {
		session,
		db,
		activeOrganization,
	};
}

export type Context = ApiContext;
