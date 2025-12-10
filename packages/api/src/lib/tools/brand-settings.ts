/**
 * Brand Settings Tool
 * 
 * Fetches brand style guidelines and design tokens for generating on-brand emails.
 * Returns colors, fonts, logo, tone, and style preferences to ensure email matches organization branding.
 */

import { z } from 'zod';
import prisma from '@mocah/db';
import { logger } from '@mocah/shared/logger';

/**
 * Tool for fetching brand settings by organization ID
 * 
 * This allows the AI model to access brand guidelines when generating templates,
 * ensuring generated emails match the organization's visual identity and tone.
 */
export const getBrandSettingsTool = {
  description: 'Fetch brand style guidelines and design tokens for generating on-brand emails. Returns colors, fonts, logo, tone, and style preferences to ensure email matches organization branding. Use when generating a new template or ensuring brand consistency.',

  inputSchema: z.object({
    organizationId: z.string().describe('The organization ID to fetch brand settings for'),
  }),

  execute: async ({ organizationId }: { organizationId: string }) => {
    try {
      logger.info('Tool: Fetching brand settings', {
        component: 'ai-tools',
        action: 'getBrandSettings',
        organizationId,
      });

      // Fetch brand kit from database
      const brandKit = await prisma.brandKit.findUnique({
        where: { organizationId },
        select: {
          // Core colors
          primaryColor: true,
          accentColor: true,
          backgroundColor: true,
          textPrimaryColor: true,
          
          // Typography
          fontFamily: true,
          
          // Brand voice
          brandVoice: true,
          brandTone: true,
          brandEnergy: true,
          
          // Assets
          logo: true,
          favicon: true,
          
          // Company info
          companyName: true,
          companyDescription: true,
          tagline: true,
          industry: true,
          targetAudience: true,
          websiteUrl: true,
        },
      });

      if (!brandKit) {
        logger.info('Tool: No brand settings found', {
          component: 'ai-tools',
          action: 'getBrandSettings',
          organizationId,
        });

        return {
          success: false,
          message: 'No brand settings found for this organization. Use default professional styling with clean layout, #0066CC as primary color, and Arial font.',
          defaults: {
            primaryColor: '#0066CC',
            accentColor: '#FF6B35',
            backgroundColor: '#FFFFFF',
            textColor: '#000000',
            fontFamily: 'Arial, sans-serif',
            brandVoice: 'professional',
          },
        };
      }

      logger.info('Tool: Brand settings retrieved successfully', {
        component: 'ai-tools',
        action: 'getBrandSettings',
        organizationId,
        hasLogo: !!brandKit.logo,
        hasPrimaryColor: !!brandKit.primaryColor,
      });

      return {
        success: true,
        brand: {
          colors: {
            primary: brandKit.primaryColor || '#0066CC',
            accent: brandKit.accentColor || '#FF6B35',
            background: brandKit.backgroundColor || '#FFFFFF',
            text: brandKit.textPrimaryColor || '#000000',
          },
          typography: {
            fontFamily: brandKit.fontFamily || 'Arial, sans-serif',
          },
          voice: {
            tone: brandKit.brandVoice || 'professional',
            energy: brandKit.brandEnergy,
            style: brandKit.brandTone,
          },
          assets: {
            logo: brandKit.logo,
            favicon: brandKit.favicon,
          },
          company: {
            name: brandKit.companyName,
            description: brandKit.companyDescription,
            tagline: brandKit.tagline,
            industry: brandKit.industry,
            targetAudience: brandKit.targetAudience,
            website: brandKit.websiteUrl,
          },
        },
      };
    } catch (error) {
      logger.error('Tool: Error fetching brand settings', {
        component: 'ai-tools',
        action: 'getBrandSettings',
        organizationId,
      }, error as Error);

      // Fail gracefully with defaults
      return {
        success: false,
        message: 'Error fetching brand settings. Using professional defaults.',
        defaults: {
          primaryColor: '#0066CC',
          accentColor: '#FF6B35',
          backgroundColor: '#FFFFFF',
          textColor: '#000000',
          fontFamily: 'Arial, sans-serif',
          brandVoice: 'professional',
        },
      };
    }
  },
};
