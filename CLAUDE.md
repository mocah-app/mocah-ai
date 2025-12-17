# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Mocah** is an AI-powered email template platform that generates professional, on-brand email templates using React Email. The platform features a visual canvas editor, AI-powered generation with streaming feedback, and multi-tenant organization support.

### Tech Stack
- **Framework**: Next.js 16.0.0 (App Router) with React 19.2 + React Compiler
- **Language**: TypeScript (strict mode)
- **API**: tRPC for end-to-end type-safe APIs
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with organization plugin
- **Storage**: Tigris S3-compatible object storage
- **Styling**: TailwindCSS 4.x with shadcn/ui components
- **Payments**: Stripe via Better Auth Stripe plugin
- **Monorepo**: Turborepo with pnpm workspaces (pnpm@10.19.0)

### Project Structure

```
mocah/
├── apps/
│   └── web/              # Next.js application (port 3001)
├── packages/
│   ├── api/              # tRPC API layer (business logic)
│   ├── auth/             # Authentication & authorization (Better Auth)
│   ├── db/               # Database schema & Prisma client
│   ├── shared/           # Shared utilities (logger, cache, validators)
│   └── config/           # Shared configuration (env validation, tsconfig)
└── dev-docs/             # Development documentation
```

## Common Commands

### Development

```bash
# Install dependencies
pnpm install

# Start all apps (Turbo orchestrates parallel builds)
pnpm run dev

# Start specific app only
pnpm run dev:web          # Next.js web app (port 3001)

# Type checking across all packages
pnpm run check-types

# Build all packages (with Turbo caching)
pnpm run build
```

### Database

```bash
# Push schema changes to database (development)
pnpm run db:push

# Generate Prisma client after schema changes
pnpm run db:generate

# Create and run migrations (production)
pnpm run db:migrate

# Deploy migrations (CI/CD)
pnpm run db:migrate:deploy

# Open Prisma Studio (database GUI at localhost:5555)
pnpm run db:studio

# Seed database
pnpm run db:seed
```

### Package-Specific Commands

```bash
# Run command in specific workspace
turbo -F web dev                    # Run web app
turbo -F @mocah/db db:push         # Push DB schema
turbo -F @mocah/api build          # Build API package

# Add dependencies
pnpm add <package> --filter web              # App-specific
pnpm add <package> --filter @mocah/api       # Package-specific
pnpm add -w <package>                        # Root workspace
```

## Architecture Overview

### Centralized API Pattern

**All business logic lives in `packages/api`**. The web app handles only UI concerns and calls tRPC procedures.

#### tRPC Router Structure

```
packages/api/src/routers/
├── index.ts              # Main app router
├── storage.ts            # File uploads (S3/Tigris)
├── organization.ts       # Organization CRUD & member management
├── brand-kit.ts          # Brand settings (colors, fonts, voice)
├── brandkit-builder.ts   # Website scraping & brand inference
├── brand-guide.ts        # Brand guidelines CRUD
├── template.ts           # Template CRUD, generation, versioning
├── chat.ts               # AI chat for template generation
└── image-asset.ts        # Image library management
```

#### API Middleware & Context

```typescript
// Request context (packages/api/src/context.ts)
createContext(): {
  session: Session,           // Better Auth session
  db: PrismaClient,          // Database client
  activeOrganization: {      // Current org with brandKit + members
    id, name, slug, logo,
    brandKit: BrandKit,
    members: Member[]
  }
}

// Middleware (packages/api/src/middleware.ts)
protectedProcedure        // Requires authenticated session
organizationProcedure     // Requires active organization
adminProcedure            // Requires owner/admin role
```

### Authentication & Authorization (Better Auth)

#### Organization Hierarchy

```
User (email/password or OAuth)
  └── Member → Organization (Agency/Brand)
      ├── BrandKit (colors, logo, fonts, voice)
      ├── Templates (email templates)
      ├── Image Assets
      └── Members (roles: owner, admin, member)
```

#### Key Authentication Features

- **Multi-tenant**: Users can be members of multiple organizations
- **Active Organization**: Stored in session (`activeOrganizationId`)
- **Auto-provisioning**: BrandKit created automatically on org creation (see `packages/auth/src/index.ts` → `afterCreateOrganization` hook)
- **Social Auth**: Google OAuth configured
- **Email Verification**: 24hr expiry via Resend
- **Password Reset**: 1hr expiry tokens

#### Better Auth Configuration

Located in `packages/auth/src/index.ts`:
- Session includes custom `activeOrganizationId` field
- Organization plugin with role-based access control
- Stripe plugin for subscription management
- Email verification and password reset flows
- Next.js cookie integration

### Database Schema (Prisma)

Schema split across multiple files in `packages/db/prisma/schema/`:

```
schema/
├── schema.prisma         # Main config
├── auth.prisma           # User, Session, Account, Verification
├── organization.prisma   # Organization, Member, Invitation
├── templates.prisma      # Template, TemplateVersion, ExportedTemplate
├── billing.prisma        # Subscription tiers
├── stripe.prisma         # Stripe customer/subscription
├── brand.prisma          # BrandKit, BrandGuide, ImageAsset
└── integrations.prisma   # Email provider integrations
```

#### Core Models

**Template & Versioning:**
- `Template` - Main template entity with React Email code
  - `reactEmailCode` (Text) - Source of truth JSX code
  - `htmlCode` (Text) - Cached HTML render
  - `tableHtmlCode` (Text) - Email-safe HTML with tables
  - `styleType` - INLINE | PREDEFINED_CLASSES | STYLE_OBJECTS
  - `styleDefinitions` (JSON) - Extracted style constants
  - `status` - DRAFT | ACTIVE | ARCHIVED
- `TemplateVersion` - Version snapshots with branching support
  - `parentVersionId` - Enables version branching
  - `isCurrent` - Marks active version
  - `changeNote` - Version description

**Organization & Brand:**
- `Organization` - Multi-tenant organization entity
- `BrandKit` - Brand identity (colors, fonts, logo, voice, custom CSS)
- `BrandGuide` - Rich brand guidelines with sections
- `Member` - User-organization link with roles

**Assets:**
- `ImageAsset` - Uploaded/AI-generated images with metadata
  - Linked to organization, template, or version
  - Type: uploaded | generated | ai

### Template Editor Architecture

The template editor (`apps/web/src/app/app/[id]/`) is built with a layered provider architecture:

#### Provider Stack (Nested Contexts)

```typescript
TemplateEditorPage (Server Component)
  └── CanvasProvider           // ReactFlow infinite canvas state
      └── TemplateProvider     // Template data, AI generation, versioning
          └── EditorModeProvider     // View/code mode, element selection
              └── HistoryProvider    // Undo/redo functionality
                  └── DesignChangesProvider  // Pending UI changes
                      └── ErrorFixProvider   // AI error fixing
                          └── ImageStudioProvider  // Image gen/editing
                              └── EditorContent (Layout)
```

#### Core Editor Components

```
EditorContent/
├── InfiniteCanvas          # Left: Visual preview (XYFlow)
├── FloatingNav             # Top: Save, export, settings
├── SmartEditorPanel        # Right: Property editor
├── ChatPanel               # AI assistant
├── ImageLibraryPanel       # Image management
└── VersionHistoryPanel     # Version timeline
```

#### Key Editor Concepts

**React Email as Source of Truth:**
- Templates store JSX code in `reactEmailCode` field
- HTML renders are cached in `htmlCode` and `tableHtmlCode`
- Style definitions extracted and stored as JSON
- Editing happens via AST manipulation (using Babel parser)

**Pending Changes System:**
- `EditorModeProvider` maintains `allPendingChanges: Map<elementId, changes>`
- Accumulates multi-element edits before save
- Enables real-time preview updates without DB writes
- Changes include: styles, content, attributes

**Dual Mode Editing:**
- **View Mode**: Visual preview with element selection
- **Code Mode**: Monaco editor with JSX syntax highlighting
- Per-node mode overrides via `EditorModeProvider`

**Streaming Generation:**
- AI generation uses Server-Sent Events (SSE)
- Phases: extracting_brand_info → building_prompt → generating_content → generating_code → validating_code → rendering
- Real-time progress updates in UI
- Template saved on completion

### React Email Utilities

Located in `apps/web/src/lib/react-email/`:

```
react-email/
├── jsx-parser.ts              # Parse JSX ↔ AST (Babel)
├── element-extractor.ts       # Extract element tree from AST
├── code-updater.ts            # Apply changes to React Email code
├── react-email-renderer.ts    # Server-side rendering to HTML
└── client-renderer.ts         # Client-side rendering with cache
```

#### Key Functions

**JSX Parsing:**
- `parseJSX(code)` - Parse JSX string to Babel AST
- `generateCode(ast)` - Generate JSX from AST
- `extractStyleDefinitions()` - Find `const styles = {...}`
- `findElementAtLine()` - Map line numbers to elements

**Element Extraction:**
- `extractElementData(ast)` - Build hierarchical element tree
- `getCurrentStyles(element)` - Resolve effective styles
- `isEditableElement()` - Check if element supports editing

**Code Updates:**
- `updateReactEmailCode(code, changes)` - Apply element modifications
- `convertInlineToStyleObject()` - Refactor inline styles to constants
- `convertStyleObjectToInline()` - Flatten style objects

**Rendering:**
- `renderReactEmail(code)` - Render to HTML (server-side)
- `renderReactEmailClientSide()` - Client-side with caching
- `convertToTableHTML()` - Generate email-safe table-based HTML

### File Storage (Tigris S3)

All uploads routed through `packages/api/src/routers/storage.ts`:

**Upload Flow:**
1. Client calls `trpc.storage.uploadLogo.mutate()` with file buffer
2. Server validates file type and size
3. File uploaded to S3 with metadata (userId, orgId, timestamp)
4. Public URL returned to client

**Storage Structure:**
```
bucket/
  └── logos/
      └── {randomUUID}/
          └── {timestamp}-{filename}
```

**Privacy:** Random UUIDs prevent enumeration; actual IDs in S3 metadata.

## Development Guidelines

### Adding New API Endpoints

1. **Create router** in `packages/api/src/routers/my-feature.ts`
2. **Register** in `packages/api/src/routers/index.ts`
3. **Use in frontend** via tRPC hooks: `trpc.myFeature.myProcedure.useQuery()`

### Database Schema Changes

1. Modify schema in `packages/db/prisma/schema/*.prisma`
2. Push changes: `pnpm run db:push` (dev) or `pnpm run db:migrate` (prod)
3. Regenerate client: `pnpm run db:generate`
4. Rebuild packages: `pnpm run build`

### Working with Templates

**Template Lifecycle:**
1. User creates template skeleton via `template.create`
2. AI generates React Email code via streaming generation
3. Code saved to `reactEmailCode` field
4. User edits via Smart Editor or Code Editor
5. Changes applied via AST manipulation
6. HTML cached on save
7. Versions created for history

**Key Template Operations:**
- `template.get(id)` - Fetch with versions
- `template.save(id, code)` - Save React Email code
- `template.generateTemplate(prompt)` - AI generation (streaming)
- `template.regenerateElement(path, prompt)` - Regenerate single element
- `template.createVersion(id, name)` - Snapshot current state
- `template.switchToVersion(versionId)` - Restore previous version

### Organization Context

All protected operations are scoped to `activeOrganization`:
- Context includes org + brandKit + members
- Use `organizationProcedure` for org-scoped operations
- Frontend: `useOrganization()` hook for current org
- Switching orgs updates session and refetches data

### Type Safety

- All API inputs validated with Zod schemas
- Prisma generates types for database models
- tRPC provides end-to-end type safety
- React Email components are type-safe JSX

## Important Implementation Notes

### Next.js 16 Changes

- **Middleware renamed**: `middleware.ts` is now `proxy.ts`
- App Router with React Server Components by default
- React 19.2 with experimental React Compiler enabled

### Multi-Tenant Data Isolation

- All queries filter by `organizationId`
- Context middleware verifies organization membership
- Soft deletes via `deletedAt` field (never hard delete user data)

### React Email Best Practices

- Use `@react-email/components` for compatibility
- Inline styles preferred for email clients
- Test renders with `convertToTableHTML()` for email-safe output
- Validate generated code before saving

### Streaming Generation

- Located in `apps/web/src/app/api/template/generate/route.ts`
- Returns Server-Sent Events (SSE)
- Client subscribes via `TemplateProvider.generateTemplateStream()`
- Progress phases update UI in real-time

### Brand Kit Integration

- Created automatically on organization creation
- Used in AI prompts for on-brand generation
- Includes: colors, fonts, logo, brandVoice, customCss
- Can be populated via website scraping (`brandBuilder.scrapeWebsite`)

### Version Control

- `TemplateVersion` stores snapshots of template state
- Supports branching via `parentVersionId`
- `isCurrent` flag marks active version
- Version switching copies version data to main template

## Environment Variables

Required in `apps/web/.env`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mocah

# Better Auth
BETTER_AUTH_SECRET=<32-char-string>
BETTER_AUTH_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001

# Client-side (must be prefixed with NEXT_PUBLIC_)
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3001

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_FREE=
STRIPE_PRICE_ID_STARTER=
STRIPE_PRICE_ID_PRO=
STRIPE_PRICE_ID_PRO_ANNUAL=
STRIPE_PRICE_ID_SCALE=
STRIPE_PRICE_ID_SCALE_ANNUAL=

# Tigris S3
TIGRIS_ENDPOINT_URL=https://fly.storage.tigris.dev
TIGRIS_ACCESS_KEY_ID=
TIGRIS_SECRET_ACCESS_KEY=
TIGRIS_BUCKET_NAME=
TIGRIS_PUBLIC_URL=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_EMAIL_DOMAIN=

# AI Generation (OpenRouter)
OPENROUTER_API_KEY=
OPENROUTER_DEFAULT_MODEL=
OPENROUTER_TEMPLATE_MODEL=

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Website Scraping
FIRECRAWL_API_KEY=

# AI Image Generation (FAL)
FAL_API_KEY=
FAL_BASE_URL=
FAL_IMAGE_MODEL=
FAL_IMAGE_EDIT_MODEL=
FAL_IMAGE_ENABLED=true
```

## Troubleshooting

### Database Issues

```bash
# Reset database (deletes all data)
pnpm run db:push --force-reset

# Check connection
pnpm run db:studio
```

### Type Errors After Schema Changes

```bash
# Regenerate Prisma client
pnpm run db:generate

# Rebuild all packages
pnpm run build
```

### tRPC Errors

- Ensure packages are built: `turbo -F @mocah/api build`
- Verify context includes session/db/organization
- Check middleware applied to protected procedures

### React Email Rendering Errors

- Validate JSX syntax via `parseJSX()`
- Check for unsupported React Email components
- Ensure style definitions are valid JS objects
- Test with `renderReactEmail()` before saving

## Additional Resources

- **WARP.md** - Comprehensive guide for WARP IDE
- **dev-docs/core-project-doc.md** - Full product vision
- **dev-docs/authentication-setup.md** - Better Auth configuration
- **dev-docs/TIGRIS-SETUP.md** - S3 storage setup
- **dev-docs/better-auth-organization.md** - Organization plugin details
