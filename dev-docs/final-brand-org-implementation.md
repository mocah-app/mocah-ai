# Final Brand/Organization Management Implementation Document
## AI Email Template Platform - Organization System Architecture

**Last Updated:** November 17, 2025  
**Status:** Ready for Implementation  
**Next Phase:** Onboarding Flow Development

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Architecture Decision](#architecture-decision)
3. [Current Implementation Status](#current-implementation-status)
4. [Data Model & Schema](#data-model--schema)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Onboarding Flow Specification](#onboarding-flow-specification)
7. [Feature Implementation Details](#feature-implementation-details)
8. [API Patterns & Examples](#api-patterns--examples)
9. [UI Components Specification](#ui-components-specification)
10. [Technical Considerations](#technical-considerations)

---

## Executive Summary

### Core Decision: Organizations = Brands (Not Teams)

**Rationale:**
- ✅ Each brand/client needs complete isolation
- ✅ Perfect for agency users managing multiple clients
- ✅ Aligns with workspace switcher feature
- ✅ No collaboration needed in MVP (Phase 1)
- ✅ Simpler data model and access control
- ✅ Matches user mental model ("workspaces")

### What This Means:
- **1 Organization = 1 Brand/Client Workspace**
- Each organization has its own Brand Kit
- Templates are scoped to organizations
- Usage tracking per organization
- Billing can be per organization (future)
- Teams feature is **disabled** for MVP

---

## Architecture Decision

### Better Auth Organization Plugin Configuration

```typescript
// packages/auth/src/index.ts (CURRENT)
export const auth = betterAuth<BetterAuthOptions>({
  plugins: [
    organization({
      // ✅ KEEP: Basic organization plugin enabled
      // ❌ NO TEAMS: teams feature not enabled
      // ✅ FUTURE: Add allowUserToCreateOrganization limits based on tier
      
      allowUserToCreateOrganization: async (user) => {
        // Check user subscription tier
        const subscription = await getUserSubscription(user.id);
        
        // Free/Starter: 1 workspace, Pro: 3 workspaces, Scale: 10 workspaces
        const limits = {
          free: 1,
          starter: 1,
          pro: 3,
          scale: 10
        };
        
        const currentOrgCount = await prisma.member.count({
          where: { userId: user.id, role: 'owner' }
        });
        
        return currentOrgCount < (limits[subscription.tier] || 1);
      },
      
      organizationLimit: async (user) => {
        const subscription = await getUserSubscription(user.id);
        const limits = { free: 1, starter: 1, pro: 3, scale: 10 };
        return limits[subscription.tier] || 1;
      },
      
      membershipLimit: 1, // MVP: No team members, only owner
      
      organizationHooks: {
        // Create default brand kit when org is created
        afterCreateOrganization: async ({ organization, user }) => {
          await prisma.brandKit.create({
            data: {
              organizationId: organization.id,
              // Sensible defaults
              primaryColor: '#3B82F6',
              secondaryColor: '#10B981',
              accentColor: '#F59E0B',
              fontFamily: 'Inter',
            }
          });
        },
        
        // Cleanup all related data when org is deleted
        afterDeleteOrganization: async ({ organization }) => {
          // Better Auth handles member cleanup
          // We handle our custom data
          await prisma.brandKit.deleteMany({
            where: { organizationId: organization.id }
          });
          // Templates, usage quotas, etc. cascade delete via schema
        }
      }
    }),
    
    stripe({
      // Subscription tracking per user (not per org for MVP)
      // Phase 2: Can add per-org billing
    })
  ]
});
```

### Client Configuration

```typescript
// apps/web/src/lib/auth-client.ts (CURRENT - GOOD)
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [
    inferAdditionalFields<typeof auth>(),
    organizationClient({
      // ✅ NO TEAMS CONFIG: Keep it simple
      // Organization methods available:
      // - create, list, getFullOrganization
      // - setActive, getActiveMember
      // - update, delete
    }),
    stripeClient({
      subscription: true,
    }),
  ],
});
```

---

## Current Implementation Status

### ✅ Completed (Ready to Use)

#### 1. Database Schema (100% Complete)
- ✅ `Organization` model with all fields
- ✅ `Member` model with user-org relationship
- ✅ `BrandKit` model (one-to-one with Organization)
- ✅ `Template` model scoped to Organization
- ✅ `Session` with `activeOrganizationId` field
- ✅ Proper indexes and cascading deletes
- ✅ Migration ready

#### 2. Authentication System (90% Complete)
- ✅ Email/password registration
- ✅ Google OAuth configured (needs env vars)
- ✅ Email verification system
- ✅ Password reset functionality
- ✅ Session management
- ✅ Protected routes
- ⚠️ **Missing:** Email verification UI flow
- ⚠️ **Missing:** Google OAuth button in forms

#### 3. UI Foundation (100% Complete)
- ✅ shadcn/ui components library
- ✅ Responsive layout system
- ✅ Theme provider (dark/light mode)
- ✅ Dashboard shell with navigation
- ✅ Form components (all auth forms)
- ✅ Card, Button, Input components
- ✅ Dialog, Select, Separator components

### ⚠️ Partially Implemented

#### 4. Dashboard (30% Complete)
- ✅ Basic page structure
- ✅ Protected route redirect
- ✅ Mock template list
- ❌ **Missing:** Workspace info display
- ❌ **Missing:** Quick action buttons
- ❌ **Missing:** Usage meter
- ❌ **Missing:** Stats/overview section
- ❌ **Missing:** Empty states for new users

### ❌ Not Started (Priority Order)

#### 5. Organization/Workspace Management (0% Complete)
**Priority: CRITICAL - Start Here**
- ❌ Workspace creation form
- ❌ Workspace switcher component (header dropdown)
- ❌ Workspace settings page
- ❌ Organization context provider
- ❌ First-time user org creation flow

#### 6. Brand Kit System (0% Complete)
**Priority: HIGH - After Workspace Management**
- ❌ Brand kit settings page
- ❌ Logo upload component
- ❌ Color picker component
- ❌ Font selector dropdown
- ❌ Brand voice selector
- ❌ Brand kit preview component

#### 7. Onboarding Flow (0% Complete)
**Priority: CRITICAL - Needed for First User Experience**
- ❌ Welcome screen
- ❌ Create first workspace step
- ❌ Brand kit setup wizard
- ❌ Skip/quick start option
- ❌ Onboarding progress indicator

---

## Data Model & Schema

### Organization (Workspace/Brand)

```prisma
model Organization {
  id          String   @id @map("_id")
  name        String   // "Acme Fashion Brand" or "Client A"
  slug        String   @unique // "acme-fashion" (for URLs)
  logo        String?  // URL to uploaded logo
  metadata    Json?    // Flexible storage for additional data
  createdAt   DateTime

  // Relations
  members     Member[]
  brandKit    BrandKit?  // One-to-one relationship
  templates   Template[]
  usageQuotas UsageQuota[]
  // ... other relations
}
```

**Metadata Structure (Recommended):**
```typescript
interface OrganizationMetadata {
  // Subscription info (if per-org billing in future)
  subscriptionTier?: 'free' | 'starter' | 'pro' | 'scale';
  
  // Usage tracking
  aiGenerationsUsed?: number;
  aiImagesGenerated?: number;
  templatesCreated?: number;
  
  // Business info
  industry?: string;
  websiteUrl?: string;
  
  // Preferences
  defaultEmailCategory?: string;
  timezone?: string;
}
```

### BrandKit (Brand Identity)

```prisma
model BrandKit {
  id              String   @id @default(uuid())
  organizationId  String   @unique // One-to-one
  
  // Colors
  primaryColor    String?  // Hex: "#3B82F6"
  secondaryColor  String?  // Hex: "#10B981"
  accentColor     String?  // Hex: "#F59E0B"
  
  // Typography
  fontFamily      String?  // "Inter", "Roboto", etc.
  
  // Assets
  logo            String?  // URL to uploaded logo
  favicon         String?  // URL to favicon
  
  // Advanced (future)
  customCss       String?  @db.Text
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime? // Soft delete
  
  // Relations
  organization    Organization @relation(...)
}
```

**Missing Field:** `brandVoice` - Add this in migration:
```prisma
brandVoice      String?  // "professional", "casual", "playful", "luxury"
```

### Template (User Content)

```prisma
model Template {
  id             String   @id @default(uuid())
  organizationId String   // Foreign key - CRITICAL for data isolation
  
  name           String   // "Welcome Email - Holiday Sale"
  description    String?
  content        String   @db.Text // HTML/MJML content
  subject        String?  // Email subject line
  category       String?  // "welcome", "promotional", etc.
  
  // User preferences
  isPublic       Boolean  @default(false)
  isFavorite     Boolean  @default(false)
  
  // Timestamps
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  deletedAt      DateTime? // Soft delete
  
  // Relations
  organization   Organization @relation(...)
  versions       TemplateVersion[]
  sections       TemplateSection[]
  exports        Export[]
}
```

### Member (User-Organization Link)

```prisma
model Member {
  id             String   @id @map("_id")
  userId         String
  organizationId String
  role           String   // "owner" for MVP (no collaborators)
  createdAt      DateTime
  
  // Relations
  user           User @relation(...)
  organization   Organization @relation(...)
  
  @@unique([organizationId, userId])
  @@index([userId]) // Query by user to get their orgs
  @@index([organizationId]) // Query by org to get members
}
```

### Session (Active Context)

```prisma
model Session {
  id                   String   @id @map("_id")
  userId               String
  activeOrganizationId String?  // ⭐ CRITICAL: Current workspace
  // ... other session fields
  
  @@index([activeOrganizationId])
}
```

---

## Implementation Roadmap

### Phase 1: Core Organization Management (Week 1 - Priority 1)

#### 1.1 Organization Context Provider
**Location:** `apps/web/src/contexts/organization-context.tsx`

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';

interface OrganizationContextValue {
  // Active organization
  activeOrganization: Organization | null;
  
  // All user's organizations
  organizations: Organization[];
  
  // Loading states
  isLoading: boolean;
  
  // Actions
  setActiveOrganization: (orgId: string) => Promise<void>;
  createOrganization: (data: CreateOrgInput) => Promise<Organization>;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();
  const [activeOrganization, setActiveOrgState] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's organizations on mount
  useEffect(() => {
    if (session?.user) {
      loadOrganizations();
    }
  }, [session]);

  const loadOrganizations = async () => {
    setIsLoading(true);
    try {
      const { data: orgs } = await authClient.organization.list({});
      setOrganizations(orgs || []);
      
      // Get active organization from session
      if (session?.activeOrganizationId) {
        const activeOrg = orgs?.find(o => o.id === session.activeOrganizationId);
        setActiveOrgState(activeOrg || null);
      } else if (orgs && orgs.length > 0) {
        // Auto-set first org as active if none set
        await setActiveOrganization(orgs[0].id);
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setActiveOrganization = async (orgId: string) => {
    try {
      await authClient.organization.setActive({ organizationId: orgId });
      const org = organizations.find(o => o.id === orgId);
      setActiveOrgState(org || null);
    } catch (error) {
      console.error('Failed to set active organization:', error);
      throw error;
    }
  };

  const createOrganization = async (data: CreateOrgInput) => {
    try {
      const { data: newOrg, error } = await authClient.organization.create({
        name: data.name,
        slug: data.slug,
        metadata: data.metadata,
      });
      
      if (error) throw error;
      
      // Refresh list and set as active
      await loadOrganizations();
      if (newOrg) {
        await setActiveOrganization(newOrg.id);
      }
      
      return newOrg;
    } catch (error) {
      console.error('Failed to create organization:', error);
      throw error;
    }
  };

  return (
    <OrganizationContext.Provider
      value={{
        activeOrganization,
        organizations,
        isLoading,
        setActiveOrganization,
        createOrganization,
        refreshOrganizations: loadOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}
```

**Integration:**
```typescript
// apps/web/src/app/layout.tsx (or dashboard layout)
import { OrganizationProvider } from '@/contexts/organization-context';

export default function DashboardLayout({ children }) {
  return (
    <OrganizationProvider>
      {children}
    </OrganizationProvider>
  );
}
```

#### 1.2 Workspace Switcher Component
**Location:** `apps/web/src/components/workspace-switcher.tsx`

```typescript
'use client';

import { useOrganization } from '@/contexts/organization-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function WorkspaceSwitcher() {
  const router = useRouter();
  const {
    activeOrganization,
    organizations,
    setActiveOrganization,
    isLoading,
  } = useOrganization();

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="w-[200px]">
        Loading...
      </Button>
    );
  }

  if (!activeOrganization && organizations.length === 0) {
    return (
      <Button
        variant="outline"
        onClick={() => router.push('/onboarding')}
        className="w-[200px]"
      >
        <Plus className="mr-2 h-4 w-4" />
        Create Workspace
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          <span className="truncate">
            {activeOrganization?.name || 'Select Workspace'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => setActiveOrganization(org.id)}
            className="cursor-pointer"
          >
            <Check
              className={`mr-2 h-4 w-4 ${
                activeOrganization?.id === org.id
                  ? 'opacity-100'
                  : 'opacity-0'
              }`}
            />
            <span className="truncate">{org.name}</span>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/workspaces/new')}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Add to Header:**
```typescript
// apps/web/src/components/dashboardHeader.tsx
import { WorkspaceSwitcher } from '@/components/workspace-switcher';

export function DashboardHeader() {
  return (
    <header className="...">
      {/* Logo/Brand */}
      <div>...</div>
      
      {/* Workspace Switcher - CENTER */}
      <WorkspaceSwitcher />
      
      {/* User Menu - RIGHT */}
      <UserMenu />
    </header>
  );
}
```

#### 1.3 Workspace Creation Form
**Location:** `apps/web/src/components/workspace-creation-form.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useOrganization } from '@/contexts/organization-context';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const workspaceSchema = z.object({
  name: z.string()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(50, 'Workspace name must be less than 50 characters'),
});

type WorkspaceFormValues = z.infer<typeof workspaceSchema>;

export function WorkspaceCreationForm() {
  const router = useRouter();
  const { createOrganization } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: '',
    },
  });

  async function onSubmit(values: WorkspaceFormValues) {
    setIsLoading(true);
    try {
      // Generate slug from name
      const slug = values.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      await createOrganization({
        name: values.name,
        slug: slug,
        metadata: {
          createdVia: 'manual',
          setupCompleted: false,
        },
      });

      toast.success('Workspace created successfully!');
      router.push('/workspaces/setup'); // Go to brand kit setup
    } catch (error: any) {
      toast.error(error.message || 'Failed to create workspace');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workspace Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Acme Fashion Brand"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                This is the name of your brand or client workspace.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Creating...' : 'Create Workspace'}
        </Button>
      </form>
    </Form>
  );
}
```

**Create Page:**
```typescript
// apps/web/src/app/(dashboard)/workspaces/new/page.tsx
import { WorkspaceCreationForm } from '@/components/workspace-creation-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewWorkspacePage() {
  return (
    <div className="container max-w-lg py-10">
      <Card>
        <CardHeader>
          <CardTitle>Create New Workspace</CardTitle>
          <CardDescription>
            Create a new workspace for your brand or client.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkspaceCreationForm />
        </CardContent>
      </Card>
    </div>
  );
}
```

### Phase 2: Brand Kit Setup (Week 1 - Priority 2)

#### 2.1 Brand Kit Schema Migration

**Add Missing Field:**
```sql
-- Add brandVoice field to brand_kit table
ALTER TABLE brand_kit ADD COLUMN brand_voice VARCHAR(50);
```

**Update Prisma Schema:**
```prisma
model BrandKit {
  // ... existing fields
  brandVoice      String?  // "professional", "casual", "playful", "luxury"
  // ... rest of model
}
```

#### 2.2 Brand Kit Setup Form
**Location:** `apps/web/src/components/brand-kit-setup-form.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useOrganization } from '@/contexts/organization-context';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

const brandKitSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
  fontFamily: z.string().min(1, 'Please select a font'),
  brandVoice: z.enum(['professional', 'casual', 'playful', 'luxury']),
  logo: z.string().optional(),
});

type BrandKitFormValues = z.infer<typeof brandKitSchema>;

const EMAIL_SAFE_FONTS = [
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS',
  'Palatino',
  'Garamond',
  'Bookman',
  'Tahoma',
];

export function BrandKitSetupForm({
  onComplete,
  allowSkip = false,
}: {
  onComplete?: () => void;
  allowSkip?: boolean;
}) {
  const { activeOrganization } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const form = useForm<BrandKitFormValues>({
    resolver: zodResolver(brandKitSchema),
    defaultValues: {
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      accentColor: '#F59E0B',
      fontFamily: 'Arial',
      brandVoice: 'professional',
    },
  });

  async function uploadLogo(file: File): Promise<string> {
    // TODO: Implement actual file upload to S3/Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('organizationId', activeOrganization!.id);

    const response = await fetch('/api/upload/logo', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload logo');
    }

    const { url } = await response.json();
    return url;
  }

  async function onSubmit(values: BrandKitFormValues) {
    if (!activeOrganization) {
      toast.error('No active workspace selected');
      return;
    }

    setIsLoading(true);
    try {
      // Upload logo if provided
      let logoUrl = values.logo;
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }

      // Create/update brand kit via tRPC
      // TODO: Implement tRPC mutation
      const response = await fetch('/api/brand-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: activeOrganization.id,
          ...values,
          logo: logoUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save brand kit');
      }

      toast.success('Brand kit saved successfully!');
      onComplete?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save brand kit');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Logo Upload */}
        <FormItem>
          <FormLabel>Logo (Optional)</FormLabel>
          <FormControl>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {logoFile ? logoFile.name : 'Upload Logo'}
              </Button>
              <input
                id="logo-upload"
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setLogoFile(file);
                }}
              />
            </div>
          </FormControl>
          <FormDescription>
            PNG, JPG, or SVG. Recommended size: 200x200px
          </FormDescription>
        </FormItem>

        {/* Primary Color */}
        <FormField
          control={form.control}
          name="primaryColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Color</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    {...field}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </FormControl>
              <FormDescription>
                Your main brand color used throughout templates
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Secondary Color */}
        <FormField
          control={form.control}
          name="secondaryColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Secondary Color (Optional)</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    {...field}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="#10B981"
                    className="flex-1"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Font Family */}
        <FormField
          control={form.control}
          name="fontFamily"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Font Family</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a font" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EMAIL_SAFE_FONTS.map((font) => (
                    <SelectItem key={font} value={font}>
                      <span style={{ fontFamily: font }}>{font}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Email-safe fonts that work across all email clients
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Brand Voice */}
        <FormField
          control={form.control}
          name="brandVoice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand Voice</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="professional">
                    Professional - Formal and authoritative
                  </SelectItem>
                  <SelectItem value="casual">
                    Casual - Friendly and conversational
                  </SelectItem>
                  <SelectItem value="playful">
                    Playful - Fun and energetic
                  </SelectItem>
                  <SelectItem value="luxury">
                    Luxury - Elegant and sophisticated
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                AI will match this tone when generating copy
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Saving...' : 'Save Brand Kit'}
          </Button>
          {allowSkip && (
            <Button
              type="button"
              variant="outline"
              onClick={onComplete}
              disabled={isLoading}
            >
              Skip for Now
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
```

---

## Onboarding Flow Specification

### Flow Overview: First-Time User Experience

**Goal:** Get user from sign-up to first template in <5 minutes

```
1. Sign Up (Email/Password or Google)
   ↓
2. Email Verification (if email/password)
   ↓
3. Welcome Screen
   ↓
4. Create First Workspace
   ↓
5. Setup Brand Kit (Optional - Can Skip)
   ↓
6. Dashboard (Ready to Create Templates)
```

### Implementation Steps

#### Step 1: Welcome Screen
**Location:** `apps/web/src/app/(onboarding)/welcome/page.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Zap, Rocket } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  // Check if user already has workspaces
  useEffect(() => {
    async function checkOrganizations() {
      if (session?.user) {
        const { data: orgs } = await authClient.organization.list({});
        if (orgs && orgs.length > 0) {
          // User already has workspaces, go to dashboard
          router.push('/dashboard');
        }
      }
    }
    checkOrganizations();
  }, [session, router]);

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="max-w-2xl">
        <CardContent className="pt-10 pb-10 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">
              Welcome to Your AI Email Studio! 🎨
            </h1>
            <p className="text-xl text-muted-foreground">
              Create beautiful, on-brand email templates in seconds
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 py-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">AI-Powered</h3>
              <p className="text-sm text-muted-foreground">
                Generate complete templates from simple prompts
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">On-Brand</h3>
              <p className="text-sm text-muted-foreground">
                Every template matches your brand perfectly
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Export Anywhere</h3>
              <p className="text-sm text-muted-foreground">
                Use with Mailchimp, Klaviyo, or download HTML
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center space-y-4">
            <Button
              size="lg"
              onClick={() => router.push('/onboarding/workspace')}
              className="w-full max-w-sm"
            >
              Get Started
            </Button>
            <p className="text-sm text-muted-foreground">
              Takes less than 2 minutes to set up
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### Step 2: Workspace Creation (Onboarding)
**Location:** `apps/web/src/app/(onboarding)/workspace/page.tsx`

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkspaceCreationForm } from '@/components/workspace-creation-form';
import { Progress } from '@/components/ui/progress';

export default function OnboardingWorkspacePage() {
  const router = useRouter();

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <div className="w-full max-w-lg space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step 1 of 2</span>
            <span>50%</span>
          </div>
          <Progress value={50} />
        </div>

        {/* Card */}
        <Card>
          <CardHeader>
            <CardTitle>Create Your First Workspace</CardTitle>
            <CardDescription>
              A workspace is where you'll organize your brand's email templates.
              You can create more workspaces later for different brands or clients.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkspaceCreationForm />
          </CardContent>
        </Card>

        {/* Hint */}
        <p className="text-center text-sm text-muted-foreground">
          💡 Pro tip: Name your workspace after your brand (e.g., "Acme Fashion")
        </p>
      </div>
    </div>
  );
}
```

#### Step 3: Brand Kit Setup (Onboarding)
**Location:** `apps/web/src/app/(onboarding)/brand-kit/page.tsx`

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandKitSetupForm } from '@/components/brand-kit-setup-form';
import { Progress } from '@/components/ui/progress';

export default function OnboardingBrandKitPage() {
  const router = useRouter();

  function handleComplete() {
    // Mark onboarding as complete
    router.push('/dashboard?onboarding=complete');
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step 2 of 2</span>
            <span>100%</span>
          </div>
          <Progress value={100} />
        </div>

        {/* Card */}
        <Card>
          <CardHeader>
            <CardTitle>Set Up Your Brand Kit</CardTitle>
            <CardDescription>
              Tell us about your brand so AI can create perfectly on-brand templates.
              Don't worry, you can always change these later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BrandKitSetupForm
              onComplete={handleComplete}
              allowSkip={true}
            />
          </CardContent>
        </Card>

        {/* Preview (Optional) */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            ✨ Your templates will automatically use these colors and fonts
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Onboarding Flow Logic

**Redirect Logic After Sign Up:**
```typescript
// apps/web/src/app/(auth)/signup/page.tsx or sign-up-form.tsx

async function handleSignUp() {
  const { data, error } = await authClient.signUp.email({
    email, password, name
  });
  
  if (error) {
    // Handle error
    return;
  }
  
  // Check if email verification is required
  if (data?.user && !data.user.emailVerified) {
    router.push('/verify-email');
  } else {
    // Signed up successfully
    router.push('/welcome');
  }
}
```

**Check Onboarding Status on Dashboard:**
```typescript
// apps/web/src/app/(dashboard)/dashboard/page.tsx

export default function DashboardPage() {
  const { data: session } = authClient.useSession();
  const { organizations, isLoading } = useOrganization();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session?.user) {
      if (organizations.length === 0) {
        // No workspaces, go to onboarding
        router.push('/welcome');
      }
    }
  }, [session, organizations, isLoading, router]);

  // Rest of dashboard...
}
```

---

## API Patterns & Examples

### tRPC Router for Organizations
**Location:** `packages/api/src/routers/organization.ts`

```typescript
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { auth } from '@mocah/auth';

export const organizationRouter = createTRPCRouter({
  // Get user's active organization with brand kit
  getActive: protectedProcedure
    .query(async ({ ctx }) => {
      const session = ctx.session;
      
      if (!session.activeOrganizationId) {
        return null;
      }

      const org = await ctx.prisma.organization.findUnique({
        where: { id: session.activeOrganizationId },
        include: {
          brandKit: true,
          _count: {
            select: {
              templates: true,
              members: true,
            },
          },
        },
      });

      return org;
    }),

  // Get all user's organizations
  list: protectedProcedure
    .query(async ({ ctx }) => {
      const organizations = await ctx.prisma.member.findMany({
        where: { userId: ctx.session.user.id },
        include: {
          organization: {
            include: {
              brandKit: true,
              _count: {
                select: { templates: true },
              },
            },
          },
        },
      });

      return organizations.map(m => m.organization);
    }),

  // Create organization (with Better Auth)
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(50),
      slug: z.string().min(2).max(50),
    }))
    .mutation(async ({ ctx, input }) => {
      // Use Better Auth API to create org
      const result = await auth.api.createOrganization({
        body: {
          name: input.name,
          slug: input.slug,
        },
        headers: ctx.headers, // Pass session cookies
      });

      return result;
    }),

  // Update organization
  update: protectedProcedure
    .input(z.object({
      organizationId: z.string(),
      data: z.object({
        name: z.string().optional(),
        logo: z.string().optional(),
        metadata: z.any().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check membership
      const member = await ctx.prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!member || member.role !== 'owner') {
        throw new Error('Unauthorized');
      }

      // Update via Better Auth
      return await auth.api.updateOrganization({
        body: {
          organizationId: input.organizationId,
          data: input.data,
        },
        headers: ctx.headers,
      });
    }),

  // Delete organization
  delete: protectedProcedure
    .input(z.object({
      organizationId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await auth.api.deleteOrganization({
        body: {
          organizationId: input.organizationId,
        },
        headers: ctx.headers,
      });
    }),
});
```

### tRPC Router for Brand Kit
**Location:** `packages/api/src/routers/brand-kit.ts`

```typescript
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const brandKitRouter = createTRPCRouter({
  // Get brand kit for active organization
  get: protectedProcedure
    .query(async ({ ctx }) => {
      const session = ctx.session;
      
      if (!session.activeOrganizationId) {
        throw new Error('No active organization');
      }

      return await ctx.prisma.brandKit.findUnique({
        where: { organizationId: session.activeOrganizationId },
      });
    }),

  // Create or update brand kit
  upsert: protectedProcedure
    .input(z.object({
      organizationId: z.string(),
      primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      accentColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      fontFamily: z.string().optional(),
      brandVoice: z.enum(['professional', 'casual', 'playful', 'luxury']).optional(),
      logo: z.string().optional(),
      favicon: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user is member of organization
      const member = await ctx.prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!member) {
        throw new Error('Unauthorized');
      }

      const { organizationId, ...data } = input;

      return await ctx.prisma.brandKit.upsert({
        where: { organizationId },
        create: {
          organizationId,
          ...data,
        },
        update: data,
      });
    }),

  // Delete brand kit
  delete: protectedProcedure
    .input(z.object({
      organizationId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user is member
      const member = await ctx.prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!member) {
        throw new Error('Unauthorized');
      }

      return await ctx.prisma.brandKit.delete({
        where: { organizationId: input.organizationId },
      });
    }),
});
```

### Example: Using tRPC in Components

```typescript
'use client';

import { trpc } from '@/utils/trpc';

export function BrandKitDisplay() {
  const { data: brandKit, isLoading } = trpc.brandKit.get.useQuery();

  if (isLoading) return <div>Loading...</div>;
  if (!brandKit) return <div>No brand kit configured</div>;

  return (
    <div>
      <div
        style={{
          backgroundColor: brandKit.primaryColor,
          width: 50,
          height: 50,
        }}
      />
      <p>Font: {brandKit.fontFamily}</p>
      <p>Voice: {brandKit.brandVoice}</p>
    </div>
  );
}
```

---

## UI Components Specification

### Dashboard with Organization Info

**Location:** `apps/web/src/app/(dashboard)/dashboard/page.tsx`

```typescript
'use client';

import { useOrganization } from '@/contexts/organization-context';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Palette } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const { activeOrganization, isLoading: orgLoading } = useOrganization();
  const { data: brandKit } = trpc.brandKit.get.useQuery(
    undefined,
    { enabled: !!activeOrganization }
  );
  const { data: templates } = trpc.template.list.useQuery(
    { organizationId: activeOrganization?.id },
    { enabled: !!activeOrganization }
  );

  if (orgLoading) {
    return <div>Loading workspace...</div>;
  }

  if (!activeOrganization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Workspace Selected</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/welcome')}>
              Create Your First Workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasBrandKit = !!brandKit;
  const templateCount = templates?.length || 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{activeOrganization.name}</h1>
          <p className="text-muted-foreground">
            {hasBrandKit
              ? 'Your workspace is all set up! 🎉'
              : 'Complete your brand kit setup'}
          </p>
        </div>
        <Button onClick={() => router.push('/templates/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Brand Kit Status */}
      {!hasBrandKit && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Set Up Your Brand Kit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure your brand colors, fonts, and logo to create perfectly
              on-brand templates automatically.
            </p>
            <Button onClick={() => router.push('/workspaces/brand-kit')}>
              Complete Setup
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Templates Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templateCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              AI Generations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">50 remaining</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Free</div>
            <Button variant="link" className="px-0">
              Upgrade
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <Plus className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">Generate Template</h3>
              <p className="text-sm text-muted-foreground">
                Create with AI from a prompt
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <Settings className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">Browse Library</h3>
              <p className="text-sm text-muted-foreground">
                Choose from 40+ templates
              </p>
            </div>
          </CardContent>
        </Card>

        {hasBrandKit && (
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <Palette className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">Edit Brand Kit</h3>
                <p className="text-sm text-muted-foreground">
                  Update colors and fonts
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Templates */}
      {templateCount > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent Templates</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Template grid/list */}
            <p className="text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-muted-foreground">
              No templates yet. Create your first template to get started!
            </p>
            <Button onClick={() => router.push('/templates/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### Workspace Settings Page

**Location:** `apps/web/src/app/(dashboard)/workspaces/[slug]/settings/page.tsx`

```typescript
'use client';

import { useOrganization } from '@/contexts/organization-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandKitSetupForm } from '@/components/brand-kit-setup-form';
import { WorkspaceSettingsForm } from '@/components/workspace-settings-form';
import { WorkspaceDangerZone } from '@/components/workspace-danger-zone';

export default function WorkspaceSettingsPage() {
  const { activeOrganization } = useOrganization();

  if (!activeOrganization) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container max-w-4xl py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workspace Settings</h1>
        <p className="text-muted-foreground">
          Manage {activeOrganization.name} settings and brand identity
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="brand-kit">Brand Kit</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Update workspace name and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkspaceSettingsForm organization={activeOrganization} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand-kit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Kit</CardTitle>
              <CardDescription>
                Manage your brand colors, fonts, and assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BrandKitSetupForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="space-y-4">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions for this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkspaceDangerZone organization={activeOrganization} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## Technical Considerations

### Data Isolation Strategy

**Critical:** All queries MUST filter by `organizationId` to prevent data leaks

```typescript
// ✅ CORRECT: Always filter by active organization
const templates = await prisma.template.findMany({
  where: {
    organizationId: session.activeOrganizationId, // CRITICAL
    deletedAt: null,
  },
});

// ❌ WRONG: Missing organization filter
const templates = await prisma.template.findMany({
  where: {
    deletedAt: null,
  },
});
```

**Middleware Pattern:**
```typescript
// packages/api/src/middleware/organization.ts
export function requireActiveOrganization() {
  return async (opts: any) => {
    const session = opts.ctx.session;
    
    if (!session?.activeOrganizationId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'No active organization',
      });
    }
    
    // Verify user is member
    const member = await opts.ctx.prisma.member.findUnique({
      where: {
        organizationId_userId: {
          organizationId: session.activeOrganizationId,
          userId: session.user.id,
        },
      },
    });
    
    if (!member) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Not a member of this organization',
      });
    }
    
    return opts.next({
      ctx: {
        ...opts.ctx,
        organizationId: session.activeOrganizationId,
        memberRole: member.role,
      },
    });
  };
}

// Usage in router
export const templateRouter = createTRPCRouter({
  list: protectedProcedure
    .use(requireActiveOrganization())
    .query(async ({ ctx }) => {
      // ctx.organizationId is guaranteed to exist
      return await ctx.prisma.template.findMany({
        where: {
          organizationId: ctx.organizationId,
          deletedAt: null,
        },
      });
    }),
});
```

### Performance Optimization

**1. Database Indexes (Already in Schema)**
```prisma
// Ensure these indexes exist
@@index([organizationId]) // On templates, members, etc.
@@index([activeOrganizationId]) // On session
@@unique([organizationId, userId]) // On member (composite)
```

**2. React Query Caching**
```typescript
// Use proper cache keys
const { data: templates } = trpc.template.list.useQuery(
  { organizationId: activeOrganization?.id },
  {
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Only fetch if organizationId exists
    enabled: !!activeOrganization?.id,
  }
);
```

**3. Lazy Loading**
```typescript
// Don't load everything on dashboard
// Load on-demand when user navigates
```

### Security Checklist

- [ ] All database queries filter by `organizationId`
- [ ] Session contains `activeOrganizationId`
- [ ] Membership verified before mutations
- [ ] File uploads scoped to organization
- [ ] Exports include only organization's data
- [ ] API endpoints check organization ownership
- [ ] Brand kit only accessible to org members
- [ ] Usage quotas tracked per organization

### File Upload Strategy (Logo)

**Option 1: AWS S3 (Recommended for Production)**
```typescript
// packages/api/src/lib/upload.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadLogo(
  file: Buffer,
  organizationId: string,
  filename: string
): Promise<string> {
  const key = `logos/${organizationId}/${Date.now()}-${filename}`;
  
  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: file,
    ContentType: 'image/png',
    ACL: 'public-read',
  }));
  
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}
```

**Option 2: Cloudinary (Easier Setup)**
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadLogo(
  fileBuffer: Buffer,
  organizationId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `organizations/${organizationId}`,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    ).end(fileBuffer);
  });
}
```

**API Route:**
```typescript
// apps/web/src/app/api/upload/logo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@mocah/auth';
import { uploadLogo } from '@/lib/upload';

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const organizationId = formData.get('organizationId') as string;

  if (!file || !organizationId) {
    return NextResponse.json({ error: 'Missing file or organizationId' }, { status: 400 });
  }

  // Verify user is member
  const member = await prisma.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: session.user.id,
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Convert file to buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Upload
  const url = await uploadLogo(buffer, organizationId, file.name);

  return NextResponse.json({ url });
}
```

---

## Summary & Next Steps

### Current Architecture Decision ✅
- **Organizations = Brands/Workspaces** (NOT Teams)
- One organization per brand/client
- Each organization has one brand kit
- Templates scoped to organizations
- Users can own multiple organizations (based on tier)

### Implementation Priority

**Phase 1: Organization Management (CRITICAL - Start Here)**
1. Organization context provider
2. Workspace switcher component
3. Workspace creation form
4. Onboarding flow (welcome → create workspace → brand kit)

**Phase 2: Brand Kit Setup (HIGH)**
5. Brand kit setup form with all fields
6. Logo upload (implement with Cloudinary or S3)
7. Brand kit display/preview
8. Brand kit settings page

**Phase 3: Dashboard Polish (MEDIUM)**
9. Dashboard with organization info
10. Usage stats display
11. Quick actions section
12. Empty states

**Phase 4: Data Isolation (CRITICAL - Throughout)**
13. Organization middleware for tRPC
14. All queries filter by `organizationId`
15. Security audit

### Files to Create (In Order)

1. `apps/web/src/contexts/organization-context.tsx`
2. `apps/web/src/components/workspace-switcher.tsx`
3. `apps/web/src/components/workspace-creation-form.tsx`
4. `apps/web/src/app/(onboarding)/welcome/page.tsx`
5. `apps/web/src/app/(onboarding)/workspace/page.tsx`
6. `apps/web/src/app/(onboarding)/brand-kit/page.tsx`
7. `apps/web/src/components/brand-kit-setup-form.tsx`
8. `packages/api/src/routers/organization.ts`
9. `packages/api/src/routers/brand-kit.ts`
10. `packages/api/src/middleware/organization.ts`
11. `apps/web/src/app/api/upload/logo/route.ts`
12. Update: `packages/auth/src/index.ts` (add hooks)
13. Update: `apps/web/src/app/(dashboard)/dashboard/page.tsx`

### Database Migrations Needed

1. Add `brandVoice` field to `BrandKit` model
2. Verify all indexes exist
3. Test cascading deletes

### Environment Variables Needed

```bash
# For Logo Upload (Choose one)

# Option 1: AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your-bucket

# Option 2: Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

---

## Ready to Implement? ✅

This document provides:
- ✅ Clear architecture decision (Organizations = Brands)
- ✅ Complete implementation roadmap
- ✅ All necessary code examples
- ✅ Security and data isolation patterns
- ✅ Onboarding flow specification
- ✅ Component hierarchy
- ✅ API patterns with tRPC

**Next Action:** Review this document, then I'll start implementing the **Organization Context Provider** and **Workspace Switcher** components.

---

*Document Status: Ready for Review*  
*Ready for Implementation: Yes*  
*Estimated Time: ~20-30 hours for complete workspace management system*

