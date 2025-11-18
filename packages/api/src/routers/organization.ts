import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@mocah/db";
import { protectedProcedure, router } from "../index";
import { organizationProcedure } from "../middleware";

export const organizationRouter = router({
	/**
	 * Get all organizations the user is a member of
	 */
	list: protectedProcedure.query(async ({ ctx }) => {
		const memberships = await ctx.db.member.findMany({
			where: {
				userId: ctx.session.user.id,
			},
			include: {
				organization: {
					include: {
						brandKit: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return memberships.map((m) => m.organization);
	}),

	/**
	 * Get the active organization with full details
	 */
	getActive: protectedProcedure.query(async ({ ctx }) => {
		if (!ctx.activeOrganization) {
			return null;
		}

		return ctx.activeOrganization;
	}),

	/**
	 * Get a specific organization by ID (verifies membership)
	 */
	getById: protectedProcedure
		.input(
			z.object({
				organizationId: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			// Verify membership
			const membership = await ctx.db.member.findFirst({
				where: {
					userId: ctx.session.user.id,
					organizationId: input.organizationId,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not a member of this organization",
				});
			}

			const organization = await ctx.db.organization.findUnique({
				where: { id: input.organizationId },
				include: {
					brandKit: true,
					members: {
						include: {
							user: true,
						},
					},
				},
			});

			return organization;
		}),

	/**
	 * Update organization details
	 */
	update: organizationProcedure
		.input(
			z.object({
				organizationId: z.string(),
				name: z.string().optional(),
				slug: z.string().optional(),
				logo: z.string().optional(),
				metadata: z.record(z.string(), z.unknown()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.session) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Not authenticated",
				});
			}

			// Verify user is member of this organization
			const membership = await ctx.db.member.findFirst({
				where: {
					userId: ctx.session.user.id,
					organizationId: input.organizationId,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not a member of this organization",
				});
			}

			const { organizationId, ...updateData } = input;

			// Check if slug is already taken
			if (updateData.slug) {
				const existing = await ctx.db.organization.findUnique({
					where: { slug: updateData.slug },
				});

				if (existing && existing.id !== organizationId) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "This slug is already taken",
					});
				}
			}

			// Build update data with proper metadata type
			const updateData2: {
				name?: string;
				slug?: string;
				logo?: string;
				metadata?: Record<string, unknown>;
			} = {};

			if (updateData.name !== undefined) updateData2.name = updateData.name;
			if (updateData.slug !== undefined) updateData2.slug = updateData.slug;
			if (updateData.logo !== undefined) updateData2.logo = updateData.logo;
			if (updateData.metadata !== undefined) {
				updateData2.metadata = updateData.metadata;
			}

			const updated = await ctx.db.organization.update({
				where: { id: organizationId },
				data: updateData2 as Prisma.OrganizationUpdateInput,
				include: {
					brandKit: true,
				},
			});

			return updated;
		}),

	/**
	 * Update organization with brand kit in a single transaction
	 */
	updateWithBrandKit: organizationProcedure
		.input(
			z.object({
				organizationId: z.string(),
				organization: z
					.object({
						name: z.string().optional(),
						slug: z.string().optional(),
						logo: z.string().optional(),
						metadata: z.record(z.string(), z.unknown()).optional(),
					})
					.optional(),
				brandKit: z
					.object({
						primaryColor: z.string().optional(),
						secondaryColor: z.string().optional(),
						accentColor: z.string().optional(),
						fontFamily: z.string().optional(),
						brandVoice: z.string().optional(),
						logo: z.string().optional(),
						favicon: z.string().optional(),
						customCss: z.string().optional(),
					})
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.session) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Not authenticated",
				});
			}

			// Verify user is member of this organization
			const membership = await ctx.db.member.findFirst({
				where: {
					userId: ctx.session.user.id,
					organizationId: input.organizationId,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not a member of this organization",
				});
			}

			type PrismaTransaction = Omit<typeof ctx.db, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

			const result = await ctx.db.$transaction(async (tx: PrismaTransaction) => {
				// Update organization if data provided
				if (input.organization) {
					const orgUpdatePayload: {
						name?: string;
						slug?: string;
						logo?: string;
						metadata?: Record<string, unknown>;
					} = {};

					if (input.organization.name !== undefined) {
						orgUpdatePayload.name = input.organization.name;
					}
					if (input.organization.slug !== undefined) {
						orgUpdatePayload.slug = input.organization.slug;
					}
					if (input.organization.logo !== undefined) {
						orgUpdatePayload.logo = input.organization.logo;
					}
					if (input.organization.metadata !== undefined) {
						orgUpdatePayload.metadata = input.organization.metadata;
					}

					await tx.organization.update({
						where: { id: input.organizationId },
						data: orgUpdatePayload as Prisma.OrganizationUpdateInput,
					});
				}

				// Update or create brand kit if data provided
				if (input.brandKit) {
					await tx.brandKit.upsert({
						where: { organizationId: input.organizationId },
						update: input.brandKit,
						create: {
							organizationId: input.organizationId,
							...input.brandKit,
						},
					});
				}

				// Return updated data
				return await tx.organization.findUnique({
					where: { id: input.organizationId },
					include: {
						brandKit: true,
					},
				});
			});

			return result;
		}),
});

