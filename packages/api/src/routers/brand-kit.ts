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
				// Core brand colors
				primaryColor: z.string().optional(),
				accentColor: z.string().optional(),
				// Typography & Voice
				fontFamily: z.string().optional(),
				brandVoice: z.string().optional(),
				// Brand assets
				logo: z.string().optional(),
				favicon: z.string().optional(),
				customCss: z.string().optional(),
				// Extended brand data (from scraping)
				websiteUrl: z.string().optional(),
				backgroundColor: z.string().optional(),
				textPrimaryColor: z.string().optional(),
				borderRadius: z.string().optional(),
				// Brand personality
				brandTone: z.string().optional(),
				brandEnergy: z.string().optional(),
				targetAudience: z.string().optional(),
				// Company info
				companyName: z.string().optional(),
				companyDescription: z.string().optional(),
				tagline: z.string().optional(),
				industry: z.string().optional(),
				productsServices: z.array(z.string()).optional(),
				brandValues: z.array(z.string()).optional(),
				socialLinks: z.record(z.string(), z.string()).optional(),
				contactEmail: z.string().optional(),
				foundingYear: z.string().optional(),
				ogImage: z.string().optional(),
				// Firecrawl content
				summary: z.string().optional(),
				links: z.array(z.string()).optional(),
				// Scraping metadata
				scrapedAt: z.date().optional(),
				scrapeConfidence: z.number().optional(),
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

			// Cast socialLinks to Prisma JSON type if present
			const prismaUpdateData = {
				...updateData,
				...(updateData.socialLinks && {
					socialLinks: updateData.socialLinks as Prisma.InputJsonValue,
				}),
			};

			// Upsert brand kit
			const brandKit = await ctx.db.brandKit.upsert({
				where: { organizationId },
				update: prismaUpdateData as Prisma.BrandKitUpdateInput,
				create: {
					organization: {
						connect: { id: organizationId },
					},
					...prismaUpdateData,
				} as Prisma.BrandKitCreateInput,
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

