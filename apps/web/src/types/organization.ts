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

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  metadata?: OrganizationMetadata;
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

