# Published Templates Management System - Implementation Plan

**Date:** 2025-12-17
**Status:** Planning Phase
**Author:** Claude Code Analysis

## Executive Summary

This document outlines the implementation plan for adding management capabilities for published templates. Currently, authorized users can publish templates to the library, but there's no interface to view, update, or delete published templates. This plan leverages the existing database schema to minimize migrations while providing a complete management experience.

---

## Current State Analysis

### What Works
- ✅ Publishing flow with authorization via `TEMPLATE_PUBLISHER_EMAILS`
- ✅ Automated thumbnail generation using ApiFlash
- ✅ Public library page with search and filtering
- ✅ Template remixing functionality
- ✅ Version history system for source templates
- ✅ Chat history preservation in published templates

### What's Missing
- ❌ No "Published Templates" view for authorized users
- ❌ No way to see which templates are published
- ❌ No unpublish functionality
- ❌ No update published template functionality
- ❌ No delete published template functionality
- ❌ No analytics on template performance (views, remixes)
- ❌ No indication in dashboard which templates are published

---

## Database Schema Assessment

### Existing Schema (No Migration Needed!)

The `TemplateLibrary` model already has everything we need:

```prisma
model TemplateLibrary {
  id                String   @id @default(cuid())
  templateId        String?  @unique // Links to source template
  name              String
  description       String?
  subject           String?
  category          String?
  thumbnail         String?  // S3 URL
  isPremium         Boolean  @default(false)
  tags              String[]
  reactEmailCode    String   @db.Text
  htmlCode          String?  @db.Text
  styleType         StyleType?
  styleDefinitions  Json?
  previewText       String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  sourceTemplate    Template? @relation(fields: [templateId], references: [id])
  customizations    WorkspaceTemplateLibrary[]
}
```

**Key Fields for Management:**
- `templateId` - Links back to source template (enables tracking)
- `createdAt/updatedAt` - Timestamp tracking
- `thumbnail` - Already stored, can be regenerated
- All content fields are stored as snapshots

### Optional Schema Enhancements (Phase 2)

If analytics are desired, we could add a new model:

```prisma
model TemplateLibraryAnalytics {
  id                  String   @id @default(cuid())
  templateLibraryId   String   @unique
  viewCount           Int      @default(0)
  remixCount          Int      @default(0)
  lastViewedAt        DateTime?
  lastRemixedAt       DateTime?

  templateLibrary     TemplateLibrary @relation(fields: [templateLibraryId], references: [id])

  @@index([templateLibraryId])
}
```

**Migration Required:** YES, but optional (Phase 2 only)

---

## Proposed Solution

### Phase 1: Core Management Interface (No Migration Required)

#### 1.1 Dashboard Sidebar Updates

**Location:** `apps/web/src/components/dashboard/dashboard-sidebar.tsx`

**Changes:**
```typescript
// Add to mainNav section (conditionally rendered for authorized users)
{
  label: "Published Templates",
  href: "/app/published",
  icon: Globe, // or BookOpen
}
```

**Conditional Rendering:**
- Check `canPublishToLibrary` permission on client
- Only show for authorized publishers
- Add to `navigationConfig.mainNav` with permission check

#### 1.2 New Published Templates Page

**Location:** `apps/web/src/app/app/published/page.tsx`

**UI Components:**
```
PublishedTemplatesPage
├── PageHeader
│   ├── Title: "Published Templates"
│   ├── Description: "Manage your templates in the public library"
│   └── Bulk Actions (Phase 2)
├── Filters & Search
│   ├── Search bar (name, description, tags)
│   ├── Category dropdown
│   ├── Premium toggle filter
│   └── Sort by (newest, oldest, most remixed)
├── PublishedTemplateGrid
│   └── PublishedTemplateCard (per template)
│       ├── Thumbnail
│       ├── Template Info (name, category, tags)
│       ├── Publish Date
│       ├── Analytics Badge (Phase 2: "X remixes")
│       ├── Status Indicator ("In Sync" | "Source Updated")
│       └── Actions Menu
│           ├── View in Library (opens /library?template={id})
│           ├── Edit Library Entry
│           ├── Update from Source (if source changed)
│           ├── Unpublish
│           └── Delete from Library
└── Empty State (if no published templates)
    └── CTA: "Publish your first template"
```

**Key Features:**
- Only show templates where `templateId` matches user's organization templates
- Display publish date (`createdAt`) and last updated (`updatedAt`)
- Show "Source Updated" badge if source template `updatedAt` > library entry `updatedAt`

#### 1.3 Template Dashboard Indicators

**Location:** `apps/web/src/components/dashboard/template-card.tsx`

**Changes:**
- Add "Published" badge overlay to template cards that have library entries
- Badge shows: "📚 Published" with link to library entry
- Position: Top-right corner, subtle design

#### 1.4 Enhanced Template Card Menu

**Location:** `apps/web/src/components/dashboard/template-card-menu.tsx`

**Current State:**
- Shows "Publish to Library" for authorized users

**New State:**
- If NOT published: "Publish to Library"
- If published: "Update Publication" + "Unpublish"
- Add "View in Library" link (if published)

---

### Phase 1: API Endpoints (tRPC Procedures)

**Location:** `packages/api/src/routers/template.ts`

#### New Procedures

##### 1. `getPublishedTemplates`
```typescript
.query(async ({ ctx }) => {
  // Get all TemplateLibrary entries where sourceTemplate.organizationId = ctx.activeOrganization.id
  // Include: sourceTemplate (for comparison), remix count (if analytics exist)
  // Return: Array of published templates with metadata
})
```

**Authorization:** Protected procedure (any authenticated user)
**Filters:** Organization-scoped automatically
**Returns:** Array of `TemplateLibrary` entries linked to user's templates

##### 2. `updateLibraryEntry`
```typescript
.mutation(async ({ ctx, input: { libraryId, updates } }) => {
  // Validate user owns source template
  // Update TemplateLibrary fields: name, description, category, tags, isPremium
  // Optionally regenerate thumbnail if requested
  // Return: Updated TemplateLibrary entry
})
```

**Authorization:** Must own source template
**Updates Allowed:**
- Metadata: name, description, category, tags, isPremium
- Thumbnail: regenerate if flag set
- Content: NOT allowed (use updateFromSource instead)

##### 3. `updateLibraryFromSource`
```typescript
.mutation(async ({ ctx, input: { libraryId } }) => {
  // Validate user owns source template
  // Get latest source template data
  // Update TemplateLibrary: reactEmailCode, htmlCode, styleDefinitions, previewText
  // Regenerate thumbnail
  // Update timestamp
  // Return: Updated entry with diff summary
})
```

**Authorization:** Must own source template
**Process:**
1. Fetch source template current state
2. Compare with library entry (detect changes)
3. Update library entry with source data
4. Regenerate thumbnail (screenshot of new version)
5. Update `updatedAt` timestamp

##### 4. `unpublishTemplate`
```typescript
.mutation(async ({ ctx, input: { libraryId } }) => {
  // Validate user owns source template
  // Soft delete: Set deletedAt on TemplateLibrary
  // OR hard delete if preferred (check for dependencies)
  // Return: Success with deletion details
})
```

**Authorization:** Must own source template
**Strategy:** Soft delete (add `deletedAt` field) OR hard delete
**Considerations:**
- Check if any `WorkspaceTemplateLibrary` customizations exist
- Decide: cascade delete customizations OR prevent deletion

##### 5. `deleteLibraryEntry`
```typescript
.mutation(async ({ ctx, input: { libraryId } }) => {
  // Same as unpublish but permanent
  // Hard delete TemplateLibrary record
  // Handle cascade: customizations
  // Return: Success
})
```

**Authorization:** Must own source template
**Cascade Behavior:**
- Delete `WorkspaceTemplateLibrary` customizations (or prevent if exist)
- Keep source template unchanged

##### 6. `getLibraryEntryForTemplate`
```typescript
.query(async ({ ctx, input: { templateId } }) => {
  // Check if template has published library entry
  // Return: TemplateLibrary entry or null
  // Include: publish date, last update, analytics (if Phase 2)
})
```

**Authorization:** Must own template
**Use Case:** Show "Published" badge and actions in dashboard

---

### Phase 1: UI Components

#### Component: `PublishedTemplateCard`

**Location:** `apps/web/src/components/dashboard/published-template-card.tsx`

```typescript
interface PublishedTemplateCardProps {
  libraryEntry: TemplateLibrary & {
    sourceTemplate: Template
    _count?: { customizations: number } // remix count
  }
  onUpdate: (id: string) => void
  onUnpublish: (id: string) => void
  onDelete: (id: string) => void
}

function PublishedTemplateCard({ libraryEntry, ... }: PublishedTemplateCardProps) {
  const isSourceUpdated = libraryEntry.sourceTemplate.updatedAt > libraryEntry.updatedAt

  return (
    <Card>
      <CardHeader>
        <Image src={libraryEntry.thumbnail} alt={libraryEntry.name} />
        {isSourceUpdated && <Badge variant="warning">Source Updated</Badge>}
        {libraryEntry.isPremium && <Badge variant="premium">Premium</Badge>}
      </CardHeader>
      <CardContent>
        <h3>{libraryEntry.name}</h3>
        <p className="text-sm text-muted-foreground">{libraryEntry.description}</p>
        <div className="flex gap-2 mt-2">
          {libraryEntry.category && <Badge>{libraryEntry.category}</Badge>}
          {libraryEntry.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
        </div>
        <div className="text-xs text-muted-foreground mt-3">
          Published: {formatDate(libraryEntry.createdAt)}
          {libraryEntry.updatedAt !== libraryEntry.createdAt && (
            <> • Updated: {formatDate(libraryEntry.updatedAt)}</>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <MoreVertical />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => window.open(`/library?template=${libraryEntry.id}`)}>
              View in Library
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdate(libraryEntry.id)}>
              Edit Library Entry
            </DropdownMenuItem>
            {isSourceUpdated && (
              <DropdownMenuItem onClick={() => onUpdateFromSource(libraryEntry.id)}>
                Update from Source Template
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onUnpublish(libraryEntry.id)} className="text-yellow-600">
              Unpublish
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(libraryEntry.id)} className="text-red-600">
              Delete from Library
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )
}
```

#### Component: `EditLibraryEntryDialog`

**Location:** `apps/web/src/components/dashboard/edit-library-entry-dialog.tsx`

```typescript
interface EditLibraryEntryDialogProps {
  libraryEntry: TemplateLibrary
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updates: Partial<TemplateLibrary>) => void
}

function EditLibraryEntryDialog({ libraryEntry, ... }: EditLibraryEntryDialogProps) {
  // Form fields:
  // - Name
  // - Description
  // - Subject line
  // - Category (dropdown)
  // - Tags (multi-select or comma-separated input)
  // - Premium toggle
  // - Regenerate thumbnail checkbox

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Library Entry</DialogTitle>
          <DialogDescription>
            Update how this template appears in the public library
          </DialogDescription>
        </DialogHeader>
        <Form onSubmit={handleSubmit}>
          <FormField label="Name" name="name" defaultValue={libraryEntry.name} />
          <FormField label="Description" name="description" type="textarea" defaultValue={libraryEntry.description} />
          <FormField label="Subject Line" name="subject" defaultValue={libraryEntry.subject} />
          <FormField label="Category" name="category" type="select" options={categories} defaultValue={libraryEntry.category} />
          <FormField label="Tags" name="tags" type="tags" defaultValue={libraryEntry.tags} />
          <FormField label="Premium Template" name="isPremium" type="checkbox" defaultValue={libraryEntry.isPremium} />
          <FormField label="Regenerate Thumbnail" name="regenerateThumbnail" type="checkbox" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Phase 2: Analytics & Advanced Features (Optional Migration)

#### Database Migration

Add analytics tracking:

```prisma
// New model in templates.prisma
model TemplateLibraryAnalytics {
  id                  String   @id @default(cuid())
  templateLibraryId   String   @unique
  viewCount           Int      @default(0)
  remixCount          Int      @default(0)
  lastViewedAt        DateTime?
  lastRemixedAt       DateTime?

  templateLibrary     TemplateLibrary @relation(fields: [templateLibraryId], references: [id], onDelete: Cascade)

  @@index([templateLibraryId])
  @@map("template_library_analytics")
}

// Update TemplateLibrary model
model TemplateLibrary {
  // ... existing fields
  analytics         TemplateLibraryAnalytics?
}
```

#### Analytics Implementation

##### Track Views
**Location:** `/apps/web/src/app/library/components/LibraryGrid.tsx`

When user opens preview modal:
```typescript
trpc.template.trackLibraryView.mutate({ templateLibraryId })
```

##### Track Remixes
**Location:** `packages/api/src/routers/template.ts` in `duplicate` procedure

When user remixes library template:
```typescript
if (sourceTemplate.libraryTemplates?.length > 0) {
  await ctx.db.templateLibraryAnalytics.update({
    where: { templateLibraryId: sourceTemplate.libraryTemplates[0].id },
    data: {
      remixCount: { increment: 1 },
      lastRemixedAt: new Date()
    }
  })
}
```

#### Analytics Display

Update `PublishedTemplateCard` to show:
- 👁️ Views: {viewCount}
- 🎨 Remixes: {remixCount}
- Last activity: {max(lastViewedAt, lastRemixedAt)}

#### Leaderboard (Optional)

Create `/app/published/insights` page:
- Top performing templates (most remixed)
- Recent activity timeline
- Category breakdown
- Charts and graphs

---

## Implementation Plan

### Phase 1A: Core Infrastructure (Week 1)
**No Database Migration Required**

1. **API Layer** (`packages/api/src/routers/template.ts`)
   - [ ] Add `getPublishedTemplates` query
   - [ ] Add `getLibraryEntryForTemplate` query
   - [ ] Add `updateLibraryEntry` mutation
   - [ ] Add `updateLibraryFromSource` mutation
   - [ ] Add `unpublishTemplate` mutation
   - [ ] Add `deleteLibraryEntry` mutation
   - [ ] Add unit tests for all procedures

2. **Authorization Helpers**
   - [ ] Create `isTemplatePublisher(userId)` helper
   - [ ] Create `ownsLibraryEntry(userId, libraryId)` helper
   - [ ] Add to context for easy access

### Phase 1B: UI Components (Week 1-2)

3. **Shared Components** (`apps/web/src/components/dashboard/`)
   - [ ] Create `PublishedTemplateCard` component
   - [ ] Create `EditLibraryEntryDialog` component
   - [ ] Create `UnpublishConfirmDialog` component
   - [ ] Create `UpdateFromSourceDialog` component
   - [ ] Add "Published" badge to existing `TemplateCard`

4. **Published Templates Page** (`apps/web/src/app/app/published/`)
   - [ ] Create `page.tsx` (server component)
   - [ ] Create `PublishedTemplatesGrid` (client component)
   - [ ] Implement search and filtering
   - [ ] Implement sorting (newest, oldest, name A-Z)
   - [ ] Add empty state UI

5. **Navigation Updates**
   - [ ] Update `dashboard-sidebar.tsx` to show "Published" link (conditional)
   - [ ] Update `navigation.ts` config
   - [ ] Add permission check on client

6. **Template Dashboard Enhancements**
   - [ ] Update `template-card.tsx` to show "Published" badge
   - [ ] Update `template-card-menu.tsx` with publish/unpublish options
   - [ ] Add "Update Publication" flow

### Phase 1C: Testing & Polish (Week 2)

7. **Testing**
   - [ ] Test publish → view in Published page → unpublish flow
   - [ ] Test edit library entry → verify changes in public library
   - [ ] Test update from source → verify sync
   - [ ] Test source updated indicator
   - [ ] Test authorization (non-publishers shouldn't see features)
   - [ ] Test with templates that have/haven't been published

8. **Documentation**
   - [ ] Update CLAUDE.md with new endpoints
   - [ ] Create user guide for publishers
   - [ ] Document environment variables (TEMPLATE_PUBLISHER_EMAILS)
   - [ ] Add screenshots to docs

### Phase 2: Analytics (Week 3 - Optional)
**Requires Database Migration**

9. **Database Migration**
   - [ ] Add `TemplateLibraryAnalytics` model to schema
   - [ ] Run `pnpm run db:migrate`
   - [ ] Backfill analytics for existing library templates (viewCount: 0)

10. **Analytics Tracking**
    - [ ] Add view tracking to library preview modal
    - [ ] Add remix tracking to duplicate procedure
    - [ ] Create analytics dashboard page

11. **Analytics Display**
    - [ ] Update `PublishedTemplateCard` with stats
    - [ ] Create `/app/published/insights` page
    - [ ] Add charts (views over time, remixes by category)

### Phase 3: Advanced Features (Week 4+ - Optional)

12. **Bulk Operations**
    - [ ] Multi-select published templates
    - [ ] Bulk unpublish
    - [ ] Bulk update categories/tags
    - [ ] Bulk premium toggle

13. **Admin Interface** (If needed)
    - [ ] Create `/app/admin/library` page
    - [ ] View ALL library templates (not just own)
    - [ ] Moderate submissions
    - [ ] Feature templates (add `isFeatured` flag)
    - [ ] Manage categories

14. **Notifications**
    - [ ] Notify publishers when their template is remixed
    - [ ] Notify when source template has updates available
    - [ ] Email digest of analytics

---

## Technical Considerations

### Authorization Strategy

**Current:** `TEMPLATE_PUBLISHER_EMAILS` environment variable

**Recommendation:** Keep for Phase 1, but consider:
- Moving to database (`User.isTemplatePublisher` boolean flag)
- Adding role-based permissions via Better Auth organization roles
- Creating "Publisher" role in organization settings

**Implementation:**
```typescript
// Current (Phase 1)
export const canPublishToLibrary = protectedProcedure.query(async ({ ctx }) => {
  const publisherEmails = process.env.TEMPLATE_PUBLISHER_EMAILS?.split(",") || []
  return publisherEmails.includes(ctx.session.user.email)
})

// Future (Phase 3)
export const canPublishToLibrary = protectedProcedure.query(async ({ ctx }) => {
  return ctx.session.user.isTemplatePublisher ||
         ctx.activeOrganization.members.some(m =>
           m.userId === ctx.session.user.id &&
           m.role === "publisher"
         )
})
```

### Soft Delete vs Hard Delete

**Unpublish Options:**

1. **Soft Delete (Recommended for Phase 1)**
   - Add `deletedAt` field to `TemplateLibrary`
   - Keeps data for potential restoration
   - Exclude from public library queries: `where: { deletedAt: null }`
   - Can be "republished" by clearing `deletedAt`

2. **Hard Delete**
   - Permanently remove from database
   - Cannot be undone
   - Faster queries (no need to filter `deletedAt`)
   - Requires cascade handling for customizations

**Recommendation:**
- Phase 1: Add soft delete (`deletedAt` field)
- Provide both "Unpublish" (soft) and "Delete Permanently" (hard) options
- Show unpublished templates in "Published Templates" page with "Restore" action

### Thumbnail Management

**Current:** Thumbnails generated via ApiFlash and stored in S3

**Considerations:**
- Regenerating thumbnails costs ~$0.002 per screenshot
- Should we automatically regenerate on `updateFromSource`?
- Should users be able to upload custom thumbnails?

**Recommendation:**
- Phase 1: Regenerate on explicit request only (checkbox in edit dialog)
- Phase 2: Add custom thumbnail upload option
- Phase 3: Batch regenerate all thumbnails (admin tool)

### Sync Strategy: Source Template Changes

**Problem:** When source template is updated, library entry becomes stale

**Detection:**
```typescript
const isStale = sourceTemplate.updatedAt > libraryEntry.updatedAt
```

**Options:**

1. **Manual Sync (Phase 1)** ✅ Recommended
   - Show "Source Updated" badge
   - User manually triggers `updateFromSource`
   - Full control over what gets published

2. **Automatic Sync (Phase 3)**
   - Auto-update library entry on source template save
   - Risk: Publishing unwanted changes
   - Requires version comparison logic

3. **Versioned Publishing (Phase 3)**
   - Library entry links to specific `TemplateVersion`
   - Can publish updates from new versions
   - More complex, but precise

**Recommendation:** Start with manual sync, add auto-sync as opt-in feature later

### Performance Considerations

**Published Templates Query:**
```typescript
// Optimize with proper indexes and selective includes
const publishedTemplates = await ctx.db.templateLibrary.findMany({
  where: {
    sourceTemplate: {
      organizationId: ctx.activeOrganization.id,
      deletedAt: null
    },
    deletedAt: null // if using soft delete
  },
  include: {
    sourceTemplate: {
      select: { id: true, name: true, updatedAt: true }
    },
    _count: {
      select: { customizations: true } // remix count
    }
  },
  orderBy: { createdAt: "desc" }
})
```

**Indexes Needed:**
- `TemplateLibrary.templateId` (already exists - @unique)
- `TemplateLibrary.createdAt` (for sorting)
- `TemplateLibrary.deletedAt` (if soft delete)

---

## Migration Requirements

### Phase 1: NO MIGRATION NEEDED ✅

All Phase 1 features work with existing schema:
- `TemplateLibrary` has all necessary fields
- `templateId` links to source template
- Timestamps already tracked (`createdAt`, `updatedAt`)
- All content fields present

### Phase 2: Optional Analytics Migration

**If implementing analytics:**

```bash
# Add to packages/db/prisma/schema/templates.prisma
model TemplateLibraryAnalytics {
  id                  String   @id @default(cuid())
  templateLibraryId   String   @unique
  viewCount           Int      @default(0)
  remixCount          Int      @default(0)
  lastViewedAt        DateTime?
  lastRemixedAt       DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  templateLibrary     TemplateLibrary @relation(fields: [templateLibraryId], references: [id], onDelete: Cascade)

  @@index([templateLibraryId])
  @@map("template_library_analytics")
}

# Run migration
pnpm run db:migrate

# Backfill existing library templates
pnpm run db:seed # or custom script
```

### Phase 3: Soft Delete Migration (If Needed)

**If implementing soft delete:**

```prisma
model TemplateLibrary {
  // ... existing fields
  deletedAt         DateTime?

  @@index([deletedAt]) // for filtering
}
```

---

## Security Considerations

### Authorization Checks

**Every published template operation must verify:**
1. User is authenticated (`protectedProcedure`)
2. User owns the source template (via organization membership)
3. User is authorized publisher (for publish action only)

**Example:**
```typescript
export const updateLibraryEntry = protectedProcedure
  .input(z.object({ libraryId: z.string(), updates: z.object({...}) }))
  .mutation(async ({ ctx, input }) => {
    // Get library entry with source template
    const libraryEntry = await ctx.db.templateLibrary.findUnique({
      where: { id: input.libraryId },
      include: { sourceTemplate: true }
    })

    if (!libraryEntry?.sourceTemplate) {
      throw new TRPCError({ code: "NOT_FOUND" })
    }

    // Verify ownership
    if (libraryEntry.sourceTemplate.organizationId !== ctx.activeOrganization.id) {
      throw new TRPCError({ code: "FORBIDDEN" })
    }

    // Proceed with update
    return ctx.db.templateLibrary.update({
      where: { id: input.libraryId },
      data: input.updates
    })
  })
```

### Public Library Safety

**Current public library endpoint:**
```typescript
export const getLibraryTemplates = publicProcedure.query(...)
```

**Safety measures:**
- Only returns non-deleted entries
- No sensitive data exposed (organization IDs hidden)
- Rate limiting via Upstash Redis
- Thumbnail URLs are public S3 URLs (already safe)

### Cascade Deletion Behavior

**If source template is deleted:**
- `TemplateLibrary.templateId` becomes null (relation is optional)
- Library entry persists (snapshot is independent)
- "Source Deleted" indicator in management UI

**If library entry is deleted:**
- `WorkspaceTemplateLibrary` customizations: CASCADE or RESTRICT?
- Recommendation: RESTRICT (prevent deletion if remixed)
- Show warning: "This template has been remixed X times"

---

## User Experience Flow

### Publisher Workflow

#### Publishing a Template
1. User creates/edits template in workspace
2. User clicks "Publish to Library" from template menu
3. Authorization check (publisher email list)
4. Dialog: Edit metadata (name, description, category, tags, premium)
5. System generates thumbnail screenshot
6. Template appears in public library immediately
7. Template card shows "Published" badge in dashboard
8. User receives success notification with library link

#### Managing Published Template
1. User navigates to "Published Templates" (sidebar link)
2. Views grid of all published templates
3. Sees indicators: "Source Updated" badge if template changed
4. Options for each template:
   - **View in Library** - Opens public preview
   - **Edit Library Entry** - Update metadata
   - **Update from Source** - Sync latest changes
   - **Unpublish** - Remove from library (soft delete)
   - **Delete** - Permanently remove (hard delete)

#### Updating Published Template
1. User edits source template in workspace
2. "Source Updated" badge appears on published template card
3. User clicks "Update from Source"
4. Confirmation dialog shows diff:
   - Fields changed
   - Preview of new version
5. User confirms
6. System regenerates thumbnail
7. Library entry updated
8. Timestamp updated

#### Unpublishing Template
1. User clicks "Unpublish" from menu
2. Confirmation dialog: "Remove from public library?"
3. Shows remix count (if > 0, show warning)
4. User confirms
5. Template removed from public library
6. Source template remains in workspace
7. Can be republished later

### Consumer Workflow (Unchanged)

1. User browses `/library` (public page)
2. Searches/filters by category
3. Clicks template to preview
4. Views full preview + chat history
5. Clicks "Remix Template"
6. Template duplicated into user's workspace
7. User can edit remix independently

---

## Testing Strategy

### Unit Tests

**API Procedures:** (`packages/api/src/routers/template.test.ts`)
- [ ] Test `getPublishedTemplates` returns only user's published templates
- [ ] Test `updateLibraryEntry` validates ownership
- [ ] Test `updateFromSource` syncs code correctly
- [ ] Test `unpublishTemplate` prevents deletion if remixed (if RESTRICT)
- [ ] Test authorization checks for all procedures

### Integration Tests

**Published Template Management:** (`apps/web/src/app/app/published/published-templates.test.tsx`)
- [ ] Test search and filtering
- [ ] Test edit library entry dialog
- [ ] Test update from source flow
- [ ] Test unpublish confirmation
- [ ] Test published badge visibility

### E2E Tests (Playwright)

**Complete Publisher Flow:**
```typescript
test('Publisher can manage published templates', async ({ page }) => {
  // Setup: Login as authorized publisher
  await loginAsPublisher(page)

  // Publish template
  await page.goto('/app')
  await page.click('[data-testid="template-card-menu"]')
  await page.click('text=Publish to Library')
  await page.fill('[name="category"]', 'Newsletter')
  await page.click('button:has-text("Publish")')
  await expect(page.locator('text=Published successfully')).toBeVisible()

  // View published templates
  await page.click('text=Published Templates')
  await expect(page.locator('[data-testid="published-template-card"]')).toBeVisible()

  // Edit library entry
  await page.click('[data-testid="template-menu"]')
  await page.click('text=Edit Library Entry')
  await page.fill('[name="description"]', 'Updated description')
  await page.click('button:has-text("Save Changes")')
  await expect(page.locator('text=Library entry updated')).toBeVisible()

  // Unpublish
  await page.click('[data-testid="template-menu"]')
  await page.click('text=Unpublish')
  await page.click('button:has-text("Confirm")')
  await expect(page.locator('text=Template unpublished')).toBeVisible()
})
```

---

## Open Questions & Decisions Needed

### 1. Soft Delete vs Hard Delete
**Question:** Should "Unpublish" soft delete or hard delete?

**Options:**
- A) Soft delete only (add `deletedAt` field, keep restore option)
- B) Two separate actions: "Unpublish" (soft) + "Delete Permanently" (hard)
- C) Hard delete only (permanent removal)

**Recommendation:** Option B - Maximum flexibility

---

### 2. Authorization Strategy
**Question:** Keep email-based authorization or migrate to role-based?

**Options:**
- A) Keep `TEMPLATE_PUBLISHER_EMAILS` environment variable (Phase 1)
- B) Add `User.isTemplatePublisher` boolean flag (Phase 2)
- C) Use organization roles (add "Publisher" role) (Phase 3)

**Recommendation:** Option A for Phase 1, migrate to Option B in Phase 2

---

### 3. Auto-Sync Behavior
**Question:** Should library entries auto-update when source template changes?

**Options:**
- A) Manual sync only (user triggers update)
- B) Auto-sync with opt-out setting
- C) Auto-sync for non-premium, manual for premium

**Recommendation:** Option A for Phase 1, add Option B as setting in Phase 2

---

### 4. Thumbnail Strategy
**Question:** When should thumbnails be regenerated?

**Options:**
- A) Only on explicit request (checkbox in edit dialog)
- B) Always regenerate on `updateFromSource`
- C) Schedule batch regeneration (weekly cron job)

**Recommendation:** Option A for Phase 1 (cost control), Option B in Phase 2 if API costs are low

---

### 5. Remix Count Protection
**Question:** Should we prevent deletion of heavily remixed templates?

**Options:**
- A) No restriction (allow deletion regardless)
- B) Show warning only (let user decide)
- C) Hard block deletion if remixes > threshold (e.g., 10)

**Recommendation:** Option B - Show warning: "This template has been remixed 25 times"

---

### 6. Category Management
**Question:** How should template categories be managed?

**Current:** Free-text string field

**Options:**
- A) Keep free-text (flexible but inconsistent)
- B) Predefined list in code (easy to implement)
- C) Database-driven with admin UI (most scalable)

**Recommendation:** Option B for Phase 1 (add to `apps/web/src/lib/constants.ts`), migrate to Option C in Phase 3

---

### 7. Analytics Scope
**Question:** What analytics should we track?

**Options:**
- A) Basic: view count, remix count only
- B) Moderate: + last viewed/remixed dates
- C) Advanced: + user demographics, conversion funnel, time-to-remix

**Recommendation:** Option B for Phase 2 (good balance)

---

## Success Metrics

### Phase 1 (Core Management)
- [ ] Publishers can view all their published templates in one place
- [ ] Publishers can edit library entry metadata without code changes
- [ ] Publishers can unpublish templates
- [ ] Publishers can detect when source template has changed
- [ ] Publishers can sync library entry with source template
- [ ] Dashboard shows "Published" badge on published templates
- [ ] Zero database migrations required

### Phase 2 (Analytics)
- [ ] Track view count per library template
- [ ] Track remix count per library template
- [ ] Display analytics in published templates dashboard
- [ ] Show "popular" indicator in public library

### Phase 3 (Advanced)
- [ ] Bulk operations on published templates
- [ ] Admin interface for all library templates
- [ ] Email notifications for template activity
- [ ] Featured templates system

---

## Rollout Plan

### Pre-Launch
1. Review plan with stakeholders
2. Confirm authorization strategy
3. Decide on soft delete vs hard delete
4. Set up feature flag (optional): `ENABLE_PUBLISHED_TEMPLATES_MANAGEMENT`

### Launch (Phase 1)
1. Deploy API changes (backwards compatible)
2. Deploy UI changes (behind feature flag if desired)
3. Enable for all publishers
4. Monitor for errors/feedback
5. Iterate based on publisher feedback

### Post-Launch (Phase 2+)
1. Gather analytics requirements
2. Implement analytics migration
3. Build insights dashboard
4. Consider advanced features based on usage

---

## Estimated Effort

### Phase 1: Core Management
- **API Development:** 3-4 days
  - 6 new procedures
  - Authorization helpers
  - Unit tests
- **UI Development:** 4-5 days
  - Published templates page
  - Component library (cards, dialogs)
  - Navigation updates
  - Template dashboard enhancements
- **Testing & QA:** 2-3 days
  - Integration tests
  - E2E tests
  - Manual testing
- **Documentation:** 1 day
  - Update CLAUDE.md
  - User guide
  - Screenshots

**Total Phase 1:** 10-13 days (2-2.5 weeks)

### Phase 2: Analytics (Optional)
- **Database Migration:** 1 day
- **API Development:** 2 days
- **UI Development:** 2-3 days
- **Testing:** 1-2 days

**Total Phase 2:** 6-8 days (1-1.5 weeks)

### Phase 3: Advanced Features (Optional)
- **Bulk Operations:** 2-3 days
- **Admin Interface:** 3-4 days
- **Notifications:** 2-3 days

**Total Phase 3:** 7-10 days (1.5-2 weeks)

---

## Dependencies

### External Services
- ApiFlash API (screenshot generation) - Already configured
- Tigris S3 (thumbnail storage) - Already configured
- Upstash Redis (rate limiting) - Already configured

### Internal Packages
- `@mocah/api` - tRPC procedures
- `@mocah/db` - Prisma schema (no changes needed for Phase 1)
- `@mocah/auth` - Session management (no changes needed)

### Environment Variables (Already Exist)
- `TEMPLATE_PUBLISHER_EMAILS` - Authorization list
- `APIFLASH_API_KEY` - Screenshot generation
- `TIGRIS_*` - S3 storage config

**No new environment variables needed for Phase 1!**

---

## Risks & Mitigations

### Risk 1: Deleting Published Templates with Remixes
**Impact:** Users lose access to templates they remixed

**Mitigation:**
- Show warning with remix count before deletion
- Consider soft delete (keep record, hide from library)
- Optional: Convert to `templateId: null` (orphan library entry)

### Risk 2: Thumbnail Generation Costs
**Impact:** ApiFlash charges per screenshot (~$0.002 each)

**Mitigation:**
- Only regenerate on explicit request (checkbox)
- Set daily/monthly generation limits per user
- Cache thumbnails aggressively
- Consider alternative: `<img>` of HTML render

### Risk 3: Stale Library Entries
**Impact:** Published templates show outdated content

**Mitigation:**
- Clear "Source Updated" indicator in UI
- Easy one-click sync from source
- Optional: Email notifications when source changes
- Future: Auto-sync opt-in setting

### Risk 4: Authorization Complexity
**Impact:** Non-publishers see features they can't use

**Mitigation:**
- Server-side authorization checks on all procedures
- Client-side permission checks for UI visibility
- Clear error messages if unauthorized
- Graceful fallback if permission changes

### Risk 5: Performance of Published Templates Query
**Impact:** Slow page load for users with many published templates

**Mitigation:**
- Proper database indexes (see Performance Considerations)
- Pagination (lazy load more templates)
- Selective includes (only fetch needed relations)
- Consider caching for expensive queries

---

## Alternative Approaches Considered

### Alternative 1: Separate "Library Templates" Workspace
**Idea:** Create a special organization for all library templates

**Pros:**
- Clear separation of published vs private
- Can use existing organization features

**Cons:**
- Complex access control (multiple orgs per user)
- Confusing UX (switching orgs to manage library)
- Doesn't scale (all publishers in one org?)

**Verdict:** ❌ Rejected - Current approach is cleaner

---

### Alternative 2: Versioned Publishing
**Idea:** Library entry links to specific `TemplateVersion` instead of template

**Pros:**
- Precise version control
- Can publish specific versions
- Easy to track what's published

**Cons:**
- More complex schema
- Requires version management UI
- Harder to sync updates

**Verdict:** 🤔 Consider for Phase 3

---

### Alternative 3: Automated Publishing
**Idea:** Auto-publish templates marked with `isPublic: true`

**Pros:**
- One less step for users
- Simpler UI

**Cons:**
- Less control over what's published
- No thumbnail generation step
- No metadata customization
- Risk of accidentally publishing drafts

**Verdict:** ❌ Rejected - Manual publishing is safer

---

## Appendix

### A. Database Schema Reference

**Current Schema (No Changes for Phase 1):**

```prisma
model Template {
  id                  String   @id @default(cuid())
  organizationId      String
  name                String
  description         String?
  subject             String?
  category            String?
  status              TemplateStatus @default(DRAFT)
  isPublic            Boolean  @default(false)
  isFavorite          Boolean  @default(false)
  reactEmailCode      String   @db.Text
  htmlCode            String?  @db.Text
  tableHtmlCode       String?  @db.Text
  styleType           StyleType?
  styleDefinitions    Json?
  previewText         String?
  currentVersionId    String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?

  organization        Organization @relation(fields: [organizationId], references: [id])
  versions            TemplateVersion[]
  libraryTemplates    TemplateLibrary[]
  // ... other relations
}

model TemplateLibrary {
  id                  String   @id @default(cuid())
  templateId          String?  @unique
  name                String
  description         String?
  subject             String?
  category            String?
  thumbnail           String?
  isPremium           Boolean  @default(false)
  tags                String[]
  reactEmailCode      String   @db.Text
  htmlCode            String?  @db.Text
  styleType           StyleType?
  styleDefinitions    Json?
  previewText         String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  sourceTemplate      Template? @relation(fields: [templateId], references: [id])
  customizations      WorkspaceTemplateLibrary[]
}
```

---

### B. API Procedures Reference

**New Procedures (Phase 1):**

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `getPublishedTemplates` | query | protected | Get all published templates for current org |
| `getLibraryEntryForTemplate` | query | protected | Get library entry for specific template |
| `updateLibraryEntry` | mutation | protected + owner | Update library entry metadata |
| `updateLibraryFromSource` | mutation | protected + owner | Sync library entry with source template |
| `unpublishTemplate` | mutation | protected + owner | Remove template from library (soft delete) |
| `deleteLibraryEntry` | mutation | protected + owner | Permanently delete library entry |

**Existing Procedures (No Changes):**

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `canPublishToLibrary` | query | protected | Check if user can publish |
| `publishToLibrary` | mutation | protected + publisher | Publish template to library |
| `getLibraryTemplates` | query | public | Get all public library templates |
| `getLibraryTemplateDetail` | query | public | Get single library template with details |
| `duplicate` | mutation | protected | Remix library template into workspace |

---

### C. UI Components Reference

**New Components (Phase 1):**

| Component | Location | Purpose |
|-----------|----------|---------|
| `PublishedTemplatesPage` | `apps/web/src/app/app/published/page.tsx` | Main page for managing published templates |
| `PublishedTemplatesGrid` | `apps/web/src/app/app/published/components/grid.tsx` | Grid layout with search/filter |
| `PublishedTemplateCard` | `apps/web/src/components/dashboard/published-template-card.tsx` | Card for published template |
| `EditLibraryEntryDialog` | `apps/web/src/components/dashboard/edit-library-entry-dialog.tsx` | Edit metadata dialog |
| `UnpublishConfirmDialog` | `apps/web/src/components/dashboard/unpublish-dialog.tsx` | Confirmation dialog |
| `UpdateFromSourceDialog` | `apps/web/src/components/dashboard/update-source-dialog.tsx` | Sync confirmation with diff |

**Updated Components (Phase 1):**

| Component | Location | Changes |
|-----------|----------|---------|
| `DashboardSidebar` | `apps/web/src/components/dashboard/dashboard-sidebar.tsx` | Add "Published Templates" link (conditional) |
| `TemplateCard` | `apps/web/src/components/dashboard/template-card.tsx` | Add "Published" badge |
| `TemplateCardMenu` | `apps/web/src/components/dashboard/template-card-menu.tsx` | Add publish/unpublish options |

---

### D. Navigation Config

**Update:** `apps/web/src/config/navigation.ts`

```typescript
export const navigationConfig = {
  mainNav: [
    {
      title: "Main",
      links: [
        { href: "/app", label: "Templates", icon: LayoutTemplate },
        // Add conditionally for publishers:
        {
          href: "/app/published",
          label: "Published Templates",
          icon: Globe,
          permission: "canPublishToLibrary" // Check on client
        },
        { href: "/app/settings", label: "Settings", icon: Settings },
      ]
    }
  ],
  // ... rest of config
}
```

---

## Conclusion

This implementation plan provides a **complete published template management system** without requiring database migrations for Phase 1. The existing schema already supports all necessary operations through the `TemplateLibrary` model's link to source templates via `templateId`.

**Key Benefits:**
- ✅ No migration required for core functionality
- ✅ Leverages existing database schema
- ✅ Minimal API surface (6 new procedures)
- ✅ Clean separation of concerns
- ✅ Scalable to advanced features (analytics, bulk ops, admin)

**Next Steps:**
1. Review and approve this plan
2. Decide on open questions (soft vs hard delete, etc.)
3. Begin Phase 1A implementation (API layer)
4. Build Phase 1B (UI components)
5. Test and deploy Phase 1C

**Estimated Timeline:** 2-2.5 weeks for complete Phase 1 implementation

Ready to proceed when approved! 🚀
