// Organization metadata types
export interface OrganizationMetadata {
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  brandVoice?: 'professional' | 'casual' | 'playful' | 'luxury';
  logo?: string;
  setupCompleted?: boolean;
  onboardingCompletedAt?: string;
  [key: string]: any; // Allow additional fields
}

export interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
}

export interface BrandKit {
  id: string;
  organizationId: string;
  
  // Core brand colors
  primaryColor: string | null;
  accentColor: string | null;
  
  // Typography & Voice
  fontFamily: string | null;
  brandVoice: string | null;
  
  // Brand assets
  logo: string | null;
  favicon: string | null;
  customCss: string | null;
  
  // Extended brand data (from scraping)
  websiteUrl: string | null;
  backgroundColor: string | null;
  textPrimaryColor: string | null;
  borderRadius: string | null;
  
  // Brand personality
  brandTone: string | null;
  brandEnergy: string | null;
  targetAudience: string | null;
  
  // Company info (from JSON extraction)
  companyName: string | null;
  companyDescription: string | null;
  tagline: string | null;
  industry: string | null;
  productsServices: string[] | null;
  brandValues: string[] | null;
  socialLinks: SocialLinks | null;
  contactEmail: string | null;
  foundingYear: string | null;
  ogImage: string | null;
  
  // Firecrawl content
  summary: string | null;
  links: string[] | null;
  
  // Scraping metadata
  scrapedAt: Date | null;
  scrapeConfidence: number | null;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  favicon?: string | null;
  metadata?: OrganizationMetadata;
  brandKit?: BrandKit | null;
  createdAt: Date;
}

export interface CreateOrgInput {
  name: string;
  slug: string;
  logo?: string;
  metadata?: OrganizationMetadata;
}

export interface UpdateOrgInput {
  name?: string;
  slug?: string;
  logo?: string;
  metadata?: OrganizationMetadata;
}

