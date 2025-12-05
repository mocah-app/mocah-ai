/**
 * Brand Scraping Router
 * 
 * Handles brand extraction from websites using Firecrawl API.
 * Provides preview and scrape+save functionality for onboarding and settings.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../index";
import { scrapeBrand, isValidUrl, normalizeUrl } from "../lib/firecrawl";
import { mapFirecrawlToBrandKit } from "../lib/brand-mapper";
import type { Prisma } from "@mocah/db";

// ============================================================================
// Input Schemas
// ============================================================================

const urlInputSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .refine((url) => isValidUrl(url), {
      message: "Please enter a valid URL",
    }),
});

const scrapeAndSaveInputSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .refine((url) => isValidUrl(url), {
      message: "Please enter a valid URL",
    }),
  organizationId: z.string(),
});

// ============================================================================
// Router
// ============================================================================

export const brandBuilderRouter = router({
  /**
   * Preview brand scrape without saving
   * 
   * Use this for onboarding to show users what was detected
   * before they create an organization.
   */
  preview: protectedProcedure
    .input(urlInputSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await scrapeBrand(input.url);

        if (!result.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Could not extract brand information from this website",
          });
        }

        const brandKit = mapFirecrawlToBrandKit(result.data);

        return {
          success: true,
          data: brandKit,
          metadata: {
            sourceUrl: result.data.metadata.sourceURL,
            statusCode: result.data.metadata.statusCode,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        // Handle specific error types
        const message =
          error instanceof Error ? error.message : "Failed to scrape website";

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message,
        });
      }
    }),

  /**
   * Scrape brand and save to organization's brand kit
   * 
   * Use this from settings to re-scan a website or
   * from onboarding after organization creation.
   */
  scrapeAndSave: protectedProcedure
    .input(scrapeAndSaveInputSchema)
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

      try {
        const result = await scrapeBrand(input.url);

        if (!result.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Could not extract brand information from this website",
          });
        }

        const mappedData = mapFirecrawlToBrandKit(result.data);

        // Prepare data for Prisma (handle null -> undefined conversion for JSON fields)
        const brandKitData = {
          // Colors
          primaryColor: mappedData.primaryColor,
          accentColor: mappedData.accentColor,
          backgroundColor: mappedData.backgroundColor,
          textPrimaryColor: mappedData.textPrimaryColor,

          // Typography
          fontFamily: mappedData.fontFamily,

          // Layout
          borderRadius: mappedData.borderRadius,

          // Images
          logo: mappedData.logo,
          favicon: mappedData.favicon,
          ogImage: mappedData.ogImage,

          // Personality
          brandVoice: mappedData.brandVoice,
          brandTone: mappedData.brandTone,
          brandEnergy: mappedData.brandEnergy,

          // Company Info
          companyName: mappedData.companyName,
          companyDescription: mappedData.companyDescription,
          tagline: mappedData.tagline,
          industry: mappedData.industry,
          // JSON fields: convert null to undefined, cast to InputJsonValue
          productsServices: mappedData.productsServices ?? undefined,
          targetAudience: mappedData.targetAudience,
          brandValues: mappedData.brandValues ?? undefined,
          socialLinks: mappedData.socialLinks
            ? (mappedData.socialLinks as Prisma.InputJsonValue)
            : undefined,
          contactEmail: mappedData.contactEmail,
          foundingYear: mappedData.foundingYear,

          // Source & Content
          websiteUrl: mappedData.websiteUrl,
          summary: mappedData.summary,
          links: mappedData.links ?? undefined,

          // Scraping metadata
          scrapedAt: new Date(),
          scrapeConfidence: mappedData.scrapeConfidence,
        };

        // Upsert brand kit
        const brandKit = await ctx.db.brandKit.upsert({
          where: { organizationId: input.organizationId },
          update: brandKitData as Prisma.BrandKitUpdateInput,
          create: {
            organization: {
              connect: { id: input.organizationId },
            },
            ...brandKitData,
          } as Prisma.BrandKitCreateInput,
        });

        // Also update organization name if we extracted a company name
        // and the org doesn't have a custom name yet
        if (mappedData.companyName) {
          const org = await ctx.db.organization.findUnique({
            where: { id: input.organizationId },
          });

          // Only update if current name looks like a placeholder
          if (org && (org.name === "My Organization" || org.name === "Untitled")) {
            await ctx.db.organization.update({
              where: { id: input.organizationId },
              data: { name: mappedData.companyName },
            });
          }
        }

        return {
          success: true,
          data: brandKit,
          extractedName: mappedData.companyName,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        const message =
          error instanceof Error ? error.message : "Failed to scrape website";

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message,
        });
      }
    }),

  /**
   * Check if Firecrawl is configured
   * 
   * Useful for conditionally showing the brand scraping UI
   */
  isConfigured: protectedProcedure.query(() => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    return {
      configured: !!apiKey,
    };
  }),

  /**
   * Validate URL without scraping
   * 
   * Quick check before initiating scrape
   */
  validateUrl: protectedProcedure
    .input(z.object({ url: z.string() }))
    .query(({ input }) => {
      const isValid = isValidUrl(input.url);
      return {
        valid: isValid,
        normalizedUrl: isValid ? normalizeUrl(input.url) : null,
      };
    }),
});

