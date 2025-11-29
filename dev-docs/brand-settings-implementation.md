# Brand Settings Implementation

## Overview
Added a comprehensive brand settings system that allows users to update their current workspace's brand identity.

## Files Created/Modified

### 1. Brand Settings Form Component
**File:** `apps/web/src/components/settings/brand-settings-form.tsx`

**Features:**
- ✅ Editable brand name with auto-slug generation
- ✅ Logo upload with preview
- ✅ Primary and secondary color pickers with hex input
- ✅ Font family selector (email-safe fonts)
- ✅ Brand voice selector (professional, casual, playful, luxury)
- ✅ Live email preview on the right side
- ✅ Form validation with Zod
- ✅ Loading states and error handling
- ✅ Reset and save buttons

### 2. Settings Page
**File:** `apps/web/src/app/app/settings/page.tsx`

**Features:**
- ✅ Tab-based layout with 4 sections:
  - **Brand** - Complete brand settings form
  - **Profile** - Placeholder (coming soon)
  - **Notifications** - Placeholder (coming soon)
  - **Security** - Placeholder (coming soon)
- ✅ Responsive design
- ✅ Icons for each tab
- ✅ Clean card-based layout

### 3. Organization Context Enhancement
**File:** `apps/web/src/contexts/organization-context.tsx`

**Changes:**
- ✅ Added `UpdateOrgInput` interface
- ✅ Added `updateOrganization()` method to context
- ✅ Updates organization via Better Auth
- ✅ Refreshes organization list after update
- ✅ Toast notifications for success/errors

## User Flow

1. User navigates to Settings (from sidebar or `/app/settings`)
2. Default "Brand" tab is selected
3. Form is pre-populated with current active organization data
4. User can modify any field:
   - Brand name
   - Logo (upload new or remove existing)
   - Colors (using color picker or hex input)
   - Font family (dropdown)
   - Brand voice (dropdown with descriptions)
5. Live preview updates in real-time as user types
6. Click "Save Changes" to update the organization
7. Success toast appears and data refreshes

## API Integration

### Better Auth Organization Update
```typescript
await authClient.organization.update({
  organizationId: orgId,
  data: {
    name: data.name,
    slug: data.slug,
    logo: data.logo,
    metadata: {
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      fontFamily: 'Arial, sans-serif',
      brandVoice: 'professional',
      // ...other metadata
    },
  },
});
```

### Logo Upload
- Uses existing `/api/upload/logo` endpoint
- Uploads to Tigris storage
- Returns public URL
- Stores URL in organization `logo` field and `metadata.logo`

## Data Structure

### Organization Metadata
```typescript
{
  primaryColor: string;      // Hex color
  secondaryColor: string;    // Hex color
  fontFamily: string;        // Email-safe font
  brandVoice: 'professional' | 'casual' | 'playful' | 'luxury';
  logo: string;             // Public URL
  setupCompleted: boolean;
  onboardingCompletedAt: string; // ISO date
}
```

## Validation

All fields are validated using Zod:
- Brand name: 2-50 characters
- Primary color: Valid hex color (required)
- Secondary color: Valid hex color (optional)
- Font family: Must be selected
- Brand voice: One of 4 options
- Logo: PNG, JPG, or SVG

## Responsive Design

- Desktop (lg+): Side-by-side form and live preview
- Mobile/Tablet: Form only (preview hidden)
- Tabs collapse to icon-only on small screens

## Dependencies Used

- `react-hook-form` - Form management
- `zod` - Schema validation
- `@hookform/resolvers/zod` - Zod integration
- `sonner` - Toast notifications
- `lucide-react` - Icons
- Better Auth organization plugin
- Existing UI components (shadcn/ui)

## Navigation

Settings page is accessible via:
- Sidebar footer "Settings" link
- Direct URL: `/app/settings`
- Already configured in `config/navigation.ts`

## Future Enhancements

The placeholder tabs are ready for:
1. **Profile Settings** - User name, email, avatar
2. **Notification Settings** - Email preferences, alerts
3. **Security Settings** - Password change, 2FA, sessions

## Testing Checklist

- [x] Form loads with current organization data
- [x] Logo upload and preview works
- [x] Color pickers update live preview
- [x] Form validation catches errors
- [x] Save updates organization successfully
- [x] Toast notifications appear
- [x] Live preview updates in real-time
- [x] Reset button restores original values
- [x] Responsive layout works on mobile
- [ ] Test with multiple organizations
- [ ] Test logo removal
- [ ] Test with various image formats

## Notes

- Logo is stored in both `organization.logo` and `organization.metadata.logo` for backwards compatibility
- Slug is auto-regenerated if brand name changes
- All updates are scoped to the active organization
- Changes are immediately reflected after save (context refreshes)

