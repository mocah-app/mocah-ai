// Organization metadata types
export interface OrganizationMetadata {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  brandVoice?: 'professional' | 'casual' | 'playful' | 'luxury';
  logo?: string;
  setupCompleted?: boolean;
  onboardingCompletedAt?: string;
  [key: string]: any; // Allow additional fields
}

export interface BrandKit {
  id: string;
  organizationId: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  fontFamily: string | null;
  brandVoice: string | null;
  logo: string | null;
  favicon: string | null;
  customCss: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
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

