import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@mocah/db";
import { protectedProcedure, router } from "../index";
import { organizationProcedure } from "../middleware";

export const organizationRouter = router({
  /**
   * Get all organizations the user is a member of
   * Returns minimal brandKit data - use getById for full brandKit
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.member.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        organization: {
          include: {
            brandKit: {
              select: {
                id: true,
                organizationId: true,
                primaryColor: true,
                accentColor: true,
                fontFamily: true,
                brandVoice: true,
                logo: true,
                favicon: true,
                backgroundColor: true,
                textPrimaryColor: true,
                borderRadius: true,
                // Omit heavy fields: links, summary, productsServices, 
                // brandValues, companyDescription, socialLinks, etc.
              },
            },
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
      })
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
          brandKit: {
            select: {
              organizationId: true,
              primaryColor: true,
              accentColor: true,
              fontFamily: true,
              brandVoice: true,
              logo: true,
            },
          },
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
      })
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
          })
          .optional(),
      })
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

      type PrismaTransaction = Omit<
        typeof ctx.db,
        | "$connect"
        | "$disconnect"
        | "$on"
        | "$transaction"
        | "$use"
        | "$extends"
      >;

      const result = await ctx.db.$transaction(
        async (tx: PrismaTransaction) => {
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
            // Cast socialLinks, productsServices, brandValues, and links as Prisma.JsonValue
            const brandKitData = {
              ...input.brandKit,
              socialLinks: input.brandKit.socialLinks as Prisma.InputJsonValue | undefined,
              productsServices: input.brandKit.productsServices as Prisma.InputJsonValue | undefined,
              brandValues: input.brandKit.brandValues as Prisma.InputJsonValue | undefined,
              links: input.brandKit.links as Prisma.InputJsonValue | undefined,
            };

            await tx.brandKit.upsert({
              where: { organizationId: input.organizationId },
              update: brandKitData,
              create: {
                organizationId: input.organizationId,
                ...brandKitData,
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
        }
      );

      return result;
    }),
});
