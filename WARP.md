# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Mocah** is an AI-powered email template platform built with a modern TypeScript stack. The platform enables users to generate professional, on-brand email templates using AI, with a focus on beautiful design, brand consistency, and export flexibility.

### Tech Stack
- **Framework**: Next.js 16.0.0 (App Router) with React 19.2
- **Language**: TypeScript (strict mode)
- **API**: tRPC for type-safe client-server communication
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with organization/team support
- **Storage**: Tigris S3-compatible object storage (via AWS SDK)
- **Styling**: TailwindCSS 4.x with shadcn/ui components
- **Payments**: Stripe integration via Better Auth Stripe plugin
- **Monorepo**: Turborepo with pnpm workspaces

### Project Structure

```
mocah/
├── apps/
│   └── web/              # Next.js application (port 3001)
├── packages/
│   ├── api/              # tRPC API layer (business logic)
│   ├── auth/             # Authentication & authorization (Better Auth)
│   ├── db/               # Database schema & Prisma client
│   ├── shared/           # Shared utilities & types
│   └── config/           # Shared configuration
└── dev-docs/             # Development documentation
```

## Common Commands

### Development

```bash
# Install dependencies
pnpm install

# Start all apps in development mode
pnpm run dev

# Start specific app
pnpm run dev:web          # Next.js web app (port 3001)

# Type checking across all packages
pnpm run check-types
```

### Building

```bash
# Build all packages
pnpm run build
```

### Database

```bash
# Push schema changes to database (development)
pnpm run db:push

# Generate Prisma client after schema changes
pnpm run db:generate

# Run database migrations (production)
pnpm run db:migrate

# Open Prisma Studio (database GUI)
pnpm run db:studio
```

### Package-Specific Commands

```bash
# Run commands in specific workspace
turbo -F web dev           # Run web app
turbo -F @mocah/db db:push # Push DB schema
```

## Architecture

### Centralized API Pattern

**All business logic lives in `packages/api`**. The web app should only handle UI concerns and call tRPC procedures.

#### API Structure

```
packages/api/src/
├── routers/
│   ├── index.ts           # Main app router
│   ├── storage.ts         # File upload (S3/Tigris)
│   ├── organization.ts    # Organization CRUD
│   └── brand-kit.ts       # Brand kit management
├── lib/
│   └── s3.ts             # S3 client & utilities
├── context.ts            # Request context (auth, db, active org)
├── middleware.ts         # Auth & role-based access control
└── index.ts              # tRPC setup
```

#### tRPC Router Tree

```
appRouter
├── healthCheck (public)
├── privateData (protected)
├── storage
│   └── uploadLogo (protected)
├── organization
│   ├── list (protected)
│   ├── getActive (protected)
│   ├── getById (protected)
│   ├── update (protected + org)
│   └── updateWithBrandKit (protected + org)
└── brandKit
    ├── get (protected)
    ├── getActive (protected + org)
    ├── update (protected)
    └── delete (protected)
```

### Authentication & Authorization

The platform uses **Better Auth** with organization plugin for multi-tenant support.

#### Key Concepts

1. **Users** have accounts and can be members of multiple organizations
2. **Organizations** represent agencies/brands (auto-created on signup)
3. **Members** link users to organizations with roles: `owner`, `admin`, `member`
4. **Active Organization** is stored in session and used as default context

#### Organization Hierarchy

```
User (email/password or OAuth)
  └── Member → Organization (Agency/Brand)
      ├── Brand Kit (colors, logo, fonts, voice)
      ├── Templates (email templates)
      └── Members (team members with roles)
```

#### Middleware & Procedures

```typescript
// From packages/api/src/middleware.ts

// Require authenticated user
protectedProcedure

// Require active organization in context
organizationProcedure

// Require admin or owner role
adminProcedure
```

#### Role-Based Access

- **Owner**: Full control (created on org creation)
- **Admin**: Can manage members, update settings
- **Member**: Can create/edit templates

### Database Schema

The Prisma schema is split into multiple files:

```
packages/db/prisma/schema/
├── schema.prisma         # Main config
├── auth.prisma           # User, Session, Account
├── organization.prisma   # Organization, Member, Invitation
├── templates.prisma      # Template, TemplateSection
├── billing.prisma        # Subscription plans
├── stripe.prisma         # Stripe customer/subscription
├── integrations.prisma   # Email provider integrations
└── ai.prisma            # AI generation history
```

#### Key Models

- **User**: Base user account
- **Organization**: Agency/brand entity (has Brand Kit)
- **Member**: User-organization relationship with role
- **BrandKit**: Organization's brand identity (colors, logo, fonts, voice)
- **Template**: Email template with sections
- **Subscription**: Stripe subscription linked to organization

### File Storage (Tigris)

All file uploads go through the centralized API.

```typescript
// Upload via tRPC
const { url } = await trpc.storage.uploadLogo.mutate({
  file: {
    name: file.name,
    type: file.type,
    size: file.size,
    arrayBuffer: await file.arrayBuffer(),
  },
  organizationId: "org_123",
});
```

**Storage Structure:**
```
bucket/
  └── logos/
      └── {randomUUID}/
          └── {timestamp}-{filename}
```
*Note: Random UUIDs are used for privacy. Organization/user IDs are stored in S3 object metadata.*

## Environment Setup

### Required Environment Variables

Create `apps/web/.env` with:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mocah

# Better Auth
BETTER_AUTH_SECRET=<generate-random-32-char-string>
BETTER_AUTH_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe (for payments)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Tigris S3 Storage
TIGRIS_ENDPOINT_URL=https://fly.storage.tigris.dev
TIGRIS_ACCESS_KEY_ID=
TIGRIS_SECRET_ACCESS_KEY=
TIGRIS_BUCKET_NAME=
TIGRIS_PUBLIC_URL=storage.mocah.ai

# Email (Resend)
RESEND_API_KEY=


# Upstash Redis (for serverless caching)
# Get these from: https://console.upstash.com/
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Getting Started

1. **Clone and install**:
   ```bash
   cd /Users/dc/Codebase/client/mocah
   pnpm install
   ```

2. **Set up PostgreSQL database**:
   ```bash
   # Update DATABASE_URL in apps/web/.env
   pnpm run db:push
   ```

3. **Start development server**:
   ```bash
   pnpm run dev
   # Web app: http://localhost:3001
   ```

4. **Optional: Open Prisma Studio**:
   ```bash
   pnpm run db:studio
   # Opens at http://localhost:5555
   ```

## Development Guidelines

### Adding New API Endpoints

1. **Create router** in `packages/api/src/routers/`:
   ```typescript
   import { router, protectedProcedure } from "../index";
   import { z } from "zod";

   export const myRouter = router({
     myProcedure: protectedProcedure
       .input(z.object({ id: z.string() }))
       .query(async ({ ctx, input }) => {
         // Business logic here
         return ctx.db.myModel.findUnique({ where: { id: input.id } });
       }),
   });
   ```

2. **Register router** in `packages/api/src/routers/index.ts`:
   ```typescript
   import { myRouter } from "./my-router";

   export const appRouter = router({
     // ... existing routers
     myFeature: myRouter,
   });
   ```

3. **Use in frontend**:
   ```typescript
   const { data } = trpc.myFeature.myProcedure.useQuery({ id: "123" });
   ```

### Database Schema Changes

1. **Modify schema** in `packages/db/prisma/schema/*.prisma`
2. **Push to database**: `pnpm run db:push` (dev) or `pnpm run db:migrate` (prod)
3. **Generate Prisma client**: `pnpm run db:generate`
4. **Rebuild packages**: `pnpm run build`

### Adding Dependencies

```bash
# Root dependencies (workspace tools)
pnpm add -w <package>

# App-specific
pnpm add <package> --filter web

# Package-specific
pnpm add <package> --filter @mocah/api
```

### Type Safety

- All API inputs/outputs are validated with Zod schemas
- Prisma provides generated types for database models
- tRPC ensures end-to-end type safety from server to client
- Use TypeScript strict mode (already configured)

## Important Notes

### Organization-Centric Model

The platform follows a **hierarchical organization model**:
- Account creation automatically creates an organization (agency)
- The creator becomes the `owner` with admin role
- Admins can invite team members and clients
- Clients receive generated passwords and can add their own team members

### Multi-Workspace Support

- Users can be members of multiple organizations
- Each session tracks an "active organization"
- All operations default to the active organization context
- Use `requireActiveOrganization` middleware to enforce this

### Brand Kit Auto-Creation

When an organization is created via Better Auth, a Brand Kit is automatically created with default values (see `packages/auth/src/index.ts` - `afterCreateOrganization` hook).

### Stripe Integration

- Subscriptions are linked to organizations, not users
- Only `owner` or `admin` roles can manage subscriptions
- Uses Better Auth Stripe plugin for webhook handling

### File Uploads

- All uploads go through `packages/api/src/routers/storage.ts`
- Files are validated server-side (type, size)
- S3 metadata includes user ID, org ID, timestamp
- Public URLs are returned for use in templates

### React Compiler

This project uses React 19.2 with the experimental React Compiler enabled (see `apps/web/next.config.ts`). Code should follow React best practices to benefit from automatic optimizations.

## References

- **Project Docs**: `/dev-docs/core-project-doc.md` - Full product vision and features
- **Implementation Status**: `/dev-docs/PHASE-1-IMPLEMENTATION-COMPLETE.md` - Completed features
- **API Migration**: `/dev-docs/API-MIGRATION-GUIDE.md` - Moving logic to centralized API
- **Tigris Setup**: `/dev-docs/TIGRIS-SETUP.md` - S3 storage configuration
- **Auth Setup**: `/dev-docs/authentication-setup.md` - Better Auth configuration

## Troubleshooting

### Database Issues

```bash
# Reset database (warning: deletes all data)
pnpm run db:push --force-reset

# Check database connection
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

- Ensure `packages/api` is built: `turbo -F @mocah/api build`
- Check that tRPC context includes required auth/db instances
- Verify middleware is applied correctly to protected routes

### Tigris Upload Failures

- Verify environment variables are set correctly
- Check bucket exists and has public read access
- Ensure AWS SDK credentials have write permissions
- Restart dev server after adding new env vars
