/**
 * Brand Mapper Utility
 * 
 * Maps Firecrawl's scrape response to our BrandKit schema.
 * Handles font mapping to email-safe fonts and brand voice inference.
 */

import type { EmailSafeFont } from "@mocah/shared";
import type { FirecrawlScrapeResponse, SocialLinks } from "./firecrawl";

// ============================================================================
// Types
// ============================================================================

export interface MappedBrandKit {
  // Core colors
  primaryColor: string | null;
  accentColor: string | null;
  backgroundColor: string;
  textPrimaryColor: string;

  // Typography
  fontFamily: string;

  // Layout
  borderRadius: string | null;

  // Images
  logo: string | null;
  favicon: string | null;
  ogImage: string | null;

  // Personality
  brandVoice: string;
  brandTone: string | null;
  brandEnergy: string | null;

  // Company Info
  companyName: string | null;
  companyDescription: string | null;
  tagline: string | null;
  industry: string | null;
  productsServices: string[] | null;
  targetAudience: string | null;
  brandValues: string[] | null;
  socialLinks: SocialLinks | null;
  contactEmail: string | null;
  foundingYear: string | null;

  // Source
  websiteUrl: string | null;

  // Firecrawl content
  summary: string | null;
  links: string[] | null;

  // Confidence
  scrapeConfidence: number | null;
}


// ============================================================================
// Main Mapper Function
// ============================================================================

/**
 * Maps Firecrawl's scrape response to our BrandKit schema
 * 
 * @param data - The data object from FirecrawlScrapeResponse
 * @returns MappedBrandKit with all fields populated or null
 */
export function mapFirecrawlToBrandKit(
  data: FirecrawlScrapeResponse["data"]
): MappedBrandKit {
  const { branding, json, metadata, summary, links } = data;

  // Extract nested objects (handle null/undefined safely)
  const colors = branding?.colors;
  const images = branding?.images;
  const personality = branding?.personality;
  const typography = branding?.typography;

  // Find best font match from email-safe fonts
  const primaryFont = findBestFontMatch(typography?.fontFamilies?.primary);

  // Map brand voice from personality
  const brandVoice = mapBrandVoice(personality?.tone, personality?.energy);

  // Company data from JSON extraction (prioritized over metadata)
  const companyData = json || {};

  return {
    // Core colors (from branding)
    primaryColor: colors?.primary || null,
    accentColor: colors?.accent || colors?.secondary || null,
    // Default background and text colors (user can customize later)
    backgroundColor: "#FFFFFF",
    textPrimaryColor: "#000000",

    // Typography
    fontFamily: primaryFont,

    // Layout
    borderRadius: branding?.spacing?.borderRadius || null,

    // Images
    logo: images?.logo || branding?.logo || null,
    favicon: images?.favicon || metadata?.favicon || null,
    ogImage: images?.ogImage || metadata?.ogImage || null,

    // Personality (from branding)
    brandVoice,
    brandTone: personality?.tone || null,
    brandEnergy: personality?.energy || null,

    // Company Info (from JSON extraction - prioritized)
    companyName: companyData.company_name || cleanTitle(metadata?.title) || null,
    companyDescription:
      companyData.company_description || metadata?.description || null,
    tagline: companyData.tagline || null,
    industry: companyData.industry || null,
    productsServices: companyData.products_services || null,
    targetAudience:
      companyData.target_audience || personality?.targetAudience || null,
    brandValues: companyData.brand_values || null,
    socialLinks: companyData.social_links || null,
    contactEmail: companyData.contact_email || null,
    foundingYear: companyData.founding_year || null,

    // Source
    websiteUrl: metadata?.sourceURL || null,

    // Firecrawl content
    summary: summary || null,
    links: links || null,

    // Confidence
    scrapeConfidence: branding?.confidence?.overall || null,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Finds the best email-safe font match for a given font family
 */
export function findBestFontMatch(fontFamily: string | undefined): EmailSafeFont {
  if (!fontFamily) return "Arial, sans-serif";

  const lowerFont = fontFamily.toLowerCase();

  // Direct matches
  if (lowerFont.includes("arial")) return "Arial, sans-serif";
  if (lowerFont.includes("helvetica")) return "Helvetica, sans-serif";
  if (lowerFont.includes("georgia")) return "Georgia, serif";
  if (lowerFont.includes("times")) return "Times New Roman, serif";
  if (lowerFont.includes("courier")) return "Courier New, monospace";
  if (lowerFont.includes("verdana")) return "Verdana, sans-serif";
  if (lowerFont.includes("trebuchet")) return "Trebuchet MS, sans-serif";
  if (lowerFont.includes("tahoma")) return "Tahoma, sans-serif";

  // Category matches (fallbacks based on font type)
  if (lowerFont.includes("mono") || lowerFont.includes("code")) {
    return "Courier New, monospace";
  }
  if (lowerFont.includes("serif") && !lowerFont.includes("sans")) {
    return "Georgia, serif";
  }
  if (
    lowerFont.includes("sans") ||
    lowerFont.includes("inter") ||
    lowerFont.includes("roboto") ||
    lowerFont.includes("open sans") ||
    lowerFont.includes("lato") ||
    lowerFont.includes("poppins") ||
    lowerFont.includes("nunito") ||
    lowerFont.includes("montserrat")
  ) {
    return "Arial, sans-serif";
  }

  // Default to Arial for unknown fonts
  return "Arial, sans-serif";
}

/**
 * Maps brand personality to our brandVoice enum
 */
export function mapBrandVoice(tone?: string, energy?: string): string {
  if (!tone) return "professional";

  const lowerTone = tone.toLowerCase();

  // Direct tone matches
  if (lowerTone.includes("playful") || lowerTone.includes("fun")) {
    return "playful";
  }
  if (lowerTone.includes("luxury") || lowerTone.includes("premium")) {
    return "luxury";
  }
  if (
    lowerTone.includes("casual") ||
    lowerTone.includes("friendly") ||
    lowerTone.includes("warm")
  ) {
    return "casual";
  }
  if (
    lowerTone.includes("professional") ||
    lowerTone.includes("formal") ||
    lowerTone.includes("corporate")
  ) {
    return "professional";
  }

  // Energy-based fallbacks
  if (energy) {
    const lowerEnergy = energy.toLowerCase();
    if (lowerEnergy === "high") return "playful";
    if (lowerEnergy === "low") return "luxury";
  }

  return "professional";
}

/**
 * Cleans a page title to extract the company name
 * Removes common suffixes like "- Home", "| Company", etc.
 */
export function cleanTitle(title: string | undefined): string | null {
  if (!title) return null;

  // Common separators and suffixes to remove
  const separators = [" - ", " | ", " · ", " — ", " :: "];
  const suffixes = [
    "home",
    "homepage",
    "welcome",
    "official site",
    "official website",
  ];

  let cleaned = title.trim();

  // Split by common separators and take the first part
  for (const sep of separators) {
    if (cleaned.includes(sep)) {
      const parts = cleaned.split(sep);
      const firstPart = parts[0]?.trim() ?? "";
      const secondPart = parts[1]?.trim() ?? "";
      // Check if first part looks like a company name (not a page descriptor)
      const first = firstPart.toLowerCase();
      if (!suffixes.some((s) => first === s)) {
        cleaned = firstPart;
        break;
      }
      // If first part is a suffix, use second part
      if (parts.length > 1 && secondPart) {
        cleaned = secondPart;
        break;
      }
    }
  }

  // Remove trailing suffixes
  const lowerCleaned = cleaned.toLowerCase();
  for (const suffix of suffixes) {
    if (lowerCleaned.endsWith(suffix)) {
      cleaned = cleaned.slice(0, -suffix.length).trim();
      // Remove trailing separator if present
      for (const sep of separators) {
        if (cleaned.endsWith(sep.trim())) {
          cleaned = cleaned.slice(0, -sep.trim().length).trim();
        }
      }
    }
  }

  return cleaned || null;
}

/**
 * Validates a hex color string
 */
export function isValidHexColor(color: string | undefined | null): boolean {
  if (!color) return false;
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Ensures a color is a valid hex, returns fallback otherwise
 */
export function ensureHexColor(
  color: string | undefined | null,
  fallback: string = "#000000"
): string {
  if (isValidHexColor(color)) return color!;
  return fallback;
}

