/**
 * Firecrawl Integration for Brand Scraping
 * 
 * Uses Firecrawl's API to extract brand identity from websites including:
 * - Colors, typography, and design system
 * - Company information via structured JSON extraction
 * - AI-generated page summary
 * - Website links
 */

import { serverEnv } from "@mocah/config/env";
import { logger } from "@mocah/shared";

const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v2/scrape";
const maxAge = 3600000

// ============================================================================
// Types
// ============================================================================

export interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
}

export interface ExtractedCompanyData {
  company_name?: string;
  company_description?: string;
  tagline?: string;
  industry?: string;
  products_services?: string[];
  target_audience?: string;
  brand_values?: string[];
  social_links?: SocialLinks;
  contact_email?: string;
  founding_year?: string;
}

export interface FirecrawlBranding {
  colorScheme?: "light" | "dark";
  logo?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    textPrimary?: string;
    textSecondary?: string;
  };
  typography?: {
    fontFamilies?: {
      primary?: string;
      heading?: string;
    };
  };
  spacing?: {
    borderRadius?: string;
  };
  images?: {
    logo?: string;
    favicon?: string;
    ogImage?: string;
  };
  personality?: {
    tone?: string;
    energy?: string;
    targetAudience?: string;
  };
  confidence?: {
    overall?: number;
  };
}

export interface FirecrawlMetadata {
  title: string;
  description: string;
  ogImage?: string;
  favicon?: string;
  sourceURL: string;
  statusCode: number;
}

export interface FirecrawlScrapeResponse {
  success: boolean;
  data: {
    branding?: FirecrawlBranding;
    json?: ExtractedCompanyData;
    markdown?: string;
    summary?: string;
    links?: string[];
    metadata: FirecrawlMetadata;
  };
  error?: string;
}

// ============================================================================
// JSON Schema for Company Extraction
// ============================================================================

const BRAND_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    company_name: {
      type: "string",
      description: "The official company or brand name",
    },
    company_description: {
      type: "string",
      description: "A brief description of what the company does (1-2 sentences)",
    },
    tagline: {
      type: "string",
      description: "The company tagline or slogan if present",
    },
    industry: {
      type: "string",
      description: "The industry or sector the company operates in",
    },
    products_services: {
      type: "array",
      items: { type: "string" },
      description: "Main products or services offered (max 5)",
    },
    target_audience: {
      type: "string",
      description: 'Who the company targets (e.g., "small businesses", "developers")',
    },
    brand_values: {
      type: "array",
      items: { type: "string" },
      description: "Core brand values or principles mentioned (max 5)",
    },
    social_links: {
      type: "object",
      properties: {
        twitter: { type: "string" },
        linkedin: { type: "string" },
        facebook: { type: "string" },
        instagram: { type: "string" },
        youtube: { type: "string" },
      },
      description: "Social media profile URLs found on the page",
    },
    contact_email: {
      type: "string",
      description: "Contact email if found",
    },
    founding_year: {
      type: "string",
      description: "Year the company was founded if mentioned",
    },
  },
  required: ["company_name", "company_description"],
} as const;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Scrapes brand information from a website URL
 * 
 * @param url - The website URL to scrape
 * @returns FirecrawlScrapeResponse with branding, company data, summary, and links
 * @throws Error if API call fails or API key is not configured
 */
export async function scrapeBrand(url: string): Promise<FirecrawlScrapeResponse> {
  const apiKey = serverEnv.FIRECRAWL_API_KEY;
  
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is not configured");
  }

  // Normalize URL
  const normalizedUrl = normalizeUrl(url);

  const response = await fetch(FIRECRAWL_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: normalizedUrl,

      formats: [
        "branding",
        "summary",
        "links",
        {
          type: "json",
          schema: BRAND_EXTRACTION_SCHEMA,
        },
      ],
      maxAge,
      // Timeout after 30 seconds
      timeout: 30000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firecrawl API error (${response.status}): ${errorText}`);
  }

  const result = (await response.json()) as FirecrawlScrapeResponse;
  logger.info(`Firecrawl scrape response: ${JSON.stringify(result)}`);

  if (!result.success) {
    throw new Error(result.error || "Failed to scrape website");
  }

  return result;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Normalizes a URL to ensure it has a protocol
 */
export function normalizeUrl(url: string): string {
  let normalized = url.trim();
  
  // Add https:// if no protocol
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = `https://${normalized}`;
  }
  
  return normalized;
}

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const normalized = normalizeUrl(url);
    new URL(normalized);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts domain from URL for display
 */
export function extractDomain(url: string): string {
  try {
    const normalized = normalizeUrl(url);
    const urlObj = new URL(normalized);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

/**
 * Filters links to only include internal links (same domain) and limits to top 10
 * 
 * @param links - Array of URLs to filter
 * @param baseUrl - The base website URL to compare against
 * @returns Array of internal links, limited to top 10
 */
export function filterInternalLinks(links: string[] | undefined | null, baseUrl: string | null | undefined): string[] {
  if (!links || !Array.isArray(links) || links.length === 0 || !baseUrl) {
    return [];
  }

  try {
    const normalizedBaseUrl = normalizeUrl(baseUrl);
    const baseUrlObj = new URL(normalizedBaseUrl);
    const baseDomain = baseUrlObj.hostname.replace("www.", "");

    const internalLinks: string[] = [];

    for (const link of links) {
      if (!link || typeof link !== "string") continue;

      try {
        const normalizedLink = normalizeUrl(link);
        const linkUrlObj = new URL(normalizedLink);
        const linkDomain = linkUrlObj.hostname.replace("www.", "");

        // Check if link is internal (same domain)
        if (linkDomain === baseDomain) {
          internalLinks.push(link);
          
          // Stop once we have 10 internal links
          if (internalLinks.length >= 10) {
            break;
          }
        }
      } catch {
        // Skip invalid URLs
        continue;
      }
    }

    return internalLinks;
  } catch {
    // If baseUrl is invalid, return empty array
    return [];
  }
}

