import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@mocah/db";
import { protectedProcedure, router } from "../index";
import { organizationProcedure } from "../middleware";

export const brandKitRouter = router({
	/**
	 * Get brand kit for an organization
	 */
	get: protectedProcedure
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

			const brandKit = await ctx.db.brandKit.findUnique({
				where: { organizationId: input.organizationId },
			});

			return brandKit;
		}),

	/**
	 * Get brand kit for active organization
	 */
	getActive: organizationProcedure.query(async ({ ctx }) => {
		const brandKit = await ctx.db.brandKit.findUnique({
			where: { organizationId: ctx.organizationId },
		});

		return brandKit;
	}),

	/**
	 * Update brand kit
	 */
	update: protectedProcedure
		.input(
			z.object({
				organizationId: z.string(),
				primaryColor: z.string().optional(),
				secondaryColor: z.string().optional(),
				accentColor: z.string().optional(),
				fontFamily: z.string().optional(),
				brandVoice: z.string().optional(),
				logo: z.string().optional(),
				favicon: z.string().optional(),
				customCss: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
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

			const { organizationId, ...updateData } = input;

			// Upsert brand kit
			const brandKit = await ctx.db.brandKit.upsert({
				where: { organizationId },
				update: updateData as Prisma.BrandKitUpdateInput,
				create: {
					organization: {
						connect: { id: organizationId },
					},
					...updateData,
				},
			});

			return brandKit;
		}),

	/**
	 * Delete brand kit (soft delete)
	 */
	delete: protectedProcedure
		.input(
			z.object({
				organizationId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
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

			await ctx.db.brandKit.update({
				where: { organizationId: input.organizationId },
				data: { deletedAt: new Date() },
			});

			return { success: true };
		}),
});

