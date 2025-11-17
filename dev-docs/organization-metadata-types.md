# Organization Metadata Types

## Overview
Defined proper TypeScript types for organization metadata to ensure type safety and prevent serialization issues.

## Problem
Previously, the metadata field was typed as `any`, which led to:
- Incorrect serialization where metadata was treated as a string and indexed character by character
- Lack of type safety when accessing metadata properties
- No IDE autocomplete for metadata fields

**Error Example:**
```json
"metadata": {
  "0": "{",
  "1": "\"",
  "2": "0",
  ...
}
```

## Solution

### 1. Created Proper Type Definitions
**File:** `apps/web/src/types/organization.ts`

```typescript
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
```

### 2. Updated Organization Context
**File:** `apps/web/src/contexts/organization-context.tsx`

**Changes:**
- Imported proper types from `@/types/organization`
- Ensured metadata is passed as an object (not stringified)
- Added comprehensive debug logging
- Better Auth handles JSON serialization automatically

**Key Update in `updateOrganization`:**
```typescript
// Pass metadata as object - Better Auth and Prisma will handle JSON serialization
if (data.metadata !== undefined) {
  // Ensure it's an object
  updatePayload.metadata = typeof data.metadata === 'string' 
    ? JSON.parse(data.metadata) 
    : data.metadata;
}
```

### 3. Updated Brand Settings Form
**File:** `apps/web/src/components/settings/brand-settings-form.tsx`

**Changes:**
- Imported `OrganizationMetadata` type
- Constructs metadata as a properly typed object
- Added debug logging before submission

**Metadata Construction:**
```typescript
const metadata: OrganizationMetadata = {
  ...(activeOrganization.metadata || {}),
  primaryColor: values.primaryColor,
  secondaryColor: values.secondaryColor,
  fontFamily: values.fontFamily,
  brandVoice: values.brandVoice,
  logo: logoUrl,
};
```

## Data Flow

### Update Process
```
1. Brand Settings Form
   ├─> Constructs metadata as OrganizationMetadata object
   └─> Calls updateOrganization(id, { metadata })

2. Organization Context
   ├─> Validates metadata is an object
   ├─> Logs metadata structure for debugging
   └─> Passes to Better Auth as object

3. Better Auth Client
   ├─> Serializes to JSON string for API
   └─> Sends to server

4. Better Auth Server
   ├─> Receives JSON string
   ├─> Passes to Prisma
   └─> Prisma stores in Json field

5. Database
   └─> Stores as proper JSONB in PostgreSQL
```

## Database Schema

```prisma
model Organization {
  id          String   @id @map("_id")
  name        String
  slug        String   @unique
  logo        String?
  metadata    Json?    // Stores as JSONB in PostgreSQL
  createdAt   DateTime
  // ... relations
}
```

## TypeScript Benefits

### Before (Any Type):
```typescript
// No type safety
const color = activeOrganization?.metadata?.primaryColor; // any
const voice = activeOrganization?.metadata?.brandVoice; // any
```

### After (Proper Types):
```typescript
// Full type safety
const color = activeOrganization?.metadata?.primaryColor; // string | undefined
const voice = activeOrganization?.metadata?.brandVoice; // 'professional' | 'casual' | 'playful' | 'luxury' | undefined
```

## Debugging

### Debug Logs Added
The following debug logs help track metadata flow:

**1. Brand Settings Form Submission:**
```typescript
logger.debug('Submitting brand settings update', {
  component: 'BrandSettingsForm',
  action: 'onSubmit',
  organizationId: activeOrganization.id,
  metadata: metadata, // Full metadata object
});
```

**2. Organization Context Update:**
```typescript
logger.debug('Updating organization', {
  component: 'OrganizationContext',
  action: 'updateOrganization',
  organizationId: orgId,
  metadataType: typeof updatePayload.metadata,
  metadataKeys: Object.keys(updatePayload.metadata || {}),
  metadataPreview: updatePayload.metadata, // Full preview
});
```

## Testing

### Verify Correct Serialization
1. Open browser console
2. Update brand settings
3. Check debug logs for:
   - `metadataType: "object"` (not "string")
   - `metadataKeys: ["primaryColor", "secondaryColor", ...]`
   - `metadataPreview` showing proper object structure

### Database Verification
```sql
SELECT 
  id,
  name,
  metadata,
  pg_typeof(metadata) as metadata_type
FROM organization 
WHERE id = 'your-org-id';
```

Should return proper JSONB:
```json
{
  "primaryColor": "#3B82F6",
  "secondaryColor": "#10B981",
  "fontFamily": "Arial, sans-serif",
  "brandVoice": "professional",
  "logo": "https://..."
}
```

## Best Practices

### ✅ DO
- Always use `OrganizationMetadata` type for metadata
- Pass metadata as object to Better Auth
- Let Better Auth/Prisma handle JSON serialization
- Use type-safe property access

### ❌ DON'T
- Use `any` type for metadata
- Manually stringify metadata before passing to Better Auth
- Access metadata properties without type checking
- Store non-JSON-serializable values in metadata

## Migration Guide

If you have existing code using `any` types:

```typescript
// Before
const org: Organization = {
  metadata: someData // any type
};

// After
import type { OrganizationMetadata } from '@/types/organization';

const org: Organization = {
  metadata: someData as OrganizationMetadata
};
```

## Future Enhancements

Consider adding more typed metadata fields:
- `theme?: 'light' | 'dark' | 'auto'`
- `timezone?: string`
- `locale?: string`
- `features?: string[]`
- `billing?: BillingMetadata`

These can be added to `OrganizationMetadata` interface as needed.

