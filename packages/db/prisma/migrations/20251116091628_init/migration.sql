-- CreateEnum
CREATE TYPE "GenerationType" AS ENUM ('text', 'image', 'template', 'email');

-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "AIModel" AS ENUM ('gpt_4', 'gpt_4_turbo', 'gpt_3_5_turbo', 'dall_e_2', 'dall_e_3', 'claude_3_opus', 'claude_3_sonnet', 'claude_3_haiku');

-- CreateEnum
CREATE TYPE "TemplateSectionType" AS ENUM ('header', 'body', 'footer', 'cta', 'divider', 'image', 'text', 'button');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('html', 'pdf', 'json', 'mailchimp', 'sendgrid', 'campaign_monitor', 'constant_contact');

-- CreateEnum
CREATE TYPE "QuotaPeriod" AS ENUM ('daily', 'weekly', 'monthly');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('mailchimp', 'sendgrid', 'klaviyo', 'hubspot', 'constant_contact', 'campaign_monitor', 'custom_api');

-- CreateEnum
CREATE TYPE "ImageVariationType" AS ENUM ('original', 'regeneration', 'variation', 'upscale', 'edit');

-- CreateTable
CREATE TABLE "generation_history" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "GenerationType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "result" TEXT,
    "model" "AIModel",
    "tokensUsed" INTEGER,
    "cost" DECIMAL(10,4),
    "status" "GenerationStatus" NOT NULL DEFAULT 'completed',
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_image" (
    "id" TEXT NOT NULL,
    "generationHistoryId" TEXT NOT NULL,
    "parentImageId" TEXT,
    "url" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "model" "AIModel",
    "size" TEXT,
    "cost" DECIMAL(10,4),
    "version" INTEGER NOT NULL DEFAULT 1,
    "variationType" "ImageVariationType" NOT NULL DEFAULT 'original',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_prompt" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_prompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_quota" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "period" "QuotaPeriod" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "textGenerations" INTEGER NOT NULL DEFAULT 0,
    "imageGenerations" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "limitTextGenerations" INTEGER,
    "limitImageGenerations" INTEGER,
    "limitTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_quota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "session" (
    "_id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "activeOrganizationId" TEXT,
    "activeTeamId" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "account" (
    "_id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "verification" (
    "_id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "interval" TEXT NOT NULL DEFAULT 'month',
    "stripePriceId" TEXT,
    "stripeProductId" TEXT,
    "annualDiscountPriceId" TEXT,
    "features" JSONB,
    "limits" JSONB,
    "maxWorkspaces" INTEGER NOT NULL DEFAULT 1,
    "maxTextGenerations" INTEGER,
    "maxImageGenerations" INTEGER,
    "maxTokens" INTEGER,
    "allowedExportFormats" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "credentials" JSONB NOT NULL,
    "config" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_sync" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordsSynced" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "integration_sync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "member" (
    "_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "invitation" (
    "_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3),

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "team" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "team_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "team_member" (
    "_id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_member_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "brand_kit" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "fontFamily" TEXT,
    "logo" TEXT,
    "favicon" TEXT,
    "customCss" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "brand_kit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription" (
    "_id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'incomplete',
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "seats" INTEGER,
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "template" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "subject" TEXT,
    "category" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_version" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "content" TEXT NOT NULL,
    "subject" TEXT,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "template_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_section" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TemplateSectionType" NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isReusable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "template_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "template_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_category_relation" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_category_relation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_library" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "subject" TEXT,
    "category" TEXT,
    "thumbnail" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "template_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_template_library" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "templateLibraryId" TEXT NOT NULL,
    "isCustomized" BOOLEAN NOT NULL DEFAULT false,
    "customContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_template_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "export_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generation_history_organizationId_idx" ON "generation_history"("organizationId");

-- CreateIndex
CREATE INDEX "generation_history_userId_idx" ON "generation_history"("userId");

-- CreateIndex
CREATE INDEX "generation_history_type_idx" ON "generation_history"("type");

-- CreateIndex
CREATE INDEX "generation_history_status_idx" ON "generation_history"("status");

-- CreateIndex
CREATE INDEX "generation_history_createdAt_idx" ON "generation_history"("createdAt");

-- CreateIndex
CREATE INDEX "generated_image_generationHistoryId_idx" ON "generated_image"("generationHistoryId");

-- CreateIndex
CREATE INDEX "generated_image_parentImageId_idx" ON "generated_image"("parentImageId");

-- CreateIndex
CREATE INDEX "generated_image_createdAt_idx" ON "generated_image"("createdAt");

-- CreateIndex
CREATE INDEX "generated_image_isActive_idx" ON "generated_image"("isActive");

-- CreateIndex
CREATE INDEX "generated_image_variationType_idx" ON "generated_image"("variationType");

-- CreateIndex
CREATE INDEX "ai_prompt_organizationId_idx" ON "ai_prompt"("organizationId");

-- CreateIndex
CREATE INDEX "ai_prompt_userId_idx" ON "ai_prompt"("userId");

-- CreateIndex
CREATE INDEX "ai_prompt_createdAt_idx" ON "ai_prompt"("createdAt");

-- CreateIndex
CREATE INDEX "usage_quota_organizationId_idx" ON "usage_quota"("organizationId");

-- CreateIndex
CREATE INDEX "usage_quota_userId_idx" ON "usage_quota"("userId");

-- CreateIndex
CREATE INDEX "usage_quota_periodStart_periodEnd_idx" ON "usage_quota"("periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "usage_quota_organizationId_userId_period_periodStart_key" ON "usage_quota"("organizationId", "userId", "period", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_activeOrganizationId_idx" ON "session"("activeOrganizationId");

-- CreateIndex
CREATE INDEX "session_activeTeamId_idx" ON "session"("activeTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "plan_name_key" ON "plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "plan_stripePriceId_key" ON "plan"("stripePriceId");

-- CreateIndex
CREATE UNIQUE INDEX "plan_stripeProductId_key" ON "plan"("stripeProductId");

-- CreateIndex
CREATE INDEX "plan_name_idx" ON "plan"("name");

-- CreateIndex
CREATE INDEX "plan_isActive_idx" ON "plan"("isActive");

-- CreateIndex
CREATE INDEX "plan_sortOrder_idx" ON "plan"("sortOrder");

-- CreateIndex
CREATE INDEX "integration_organizationId_idx" ON "integration"("organizationId");

-- CreateIndex
CREATE INDEX "integration_type_idx" ON "integration"("type");

-- CreateIndex
CREATE INDEX "integration_isActive_idx" ON "integration"("isActive");

-- CreateIndex
CREATE INDEX "integration_deletedAt_idx" ON "integration"("deletedAt");

-- CreateIndex
CREATE INDEX "integration_sync_integrationId_idx" ON "integration_sync"("integrationId");

-- CreateIndex
CREATE INDEX "integration_sync_status_idx" ON "integration_sync"("status");

-- CreateIndex
CREATE INDEX "integration_sync_startedAt_idx" ON "integration_sync"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- CreateIndex
CREATE INDEX "organization_slug_idx" ON "organization"("slug");

-- CreateIndex
CREATE INDEX "member_userId_idx" ON "member"("userId");

-- CreateIndex
CREATE INDEX "member_organizationId_idx" ON "member"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "member_organizationId_userId_key" ON "member"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "invitation_email_idx" ON "invitation"("email");

-- CreateIndex
CREATE INDEX "invitation_organizationId_idx" ON "invitation"("organizationId");

-- CreateIndex
CREATE INDEX "invitation_status_idx" ON "invitation"("status");

-- CreateIndex
CREATE INDEX "invitation_expiresAt_idx" ON "invitation"("expiresAt");

-- CreateIndex
CREATE INDEX "team_organizationId_idx" ON "team"("organizationId");

-- CreateIndex
CREATE INDEX "team_member_teamId_idx" ON "team_member"("teamId");

-- CreateIndex
CREATE INDEX "team_member_userId_idx" ON "team_member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "team_member_teamId_userId_key" ON "team_member"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "brand_kit_organizationId_key" ON "brand_kit"("organizationId");

-- CreateIndex
CREATE INDEX "brand_kit_organizationId_idx" ON "brand_kit"("organizationId");

-- CreateIndex
CREATE INDEX "brand_kit_deletedAt_idx" ON "brand_kit"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_referenceId_key" ON "subscription"("referenceId");

-- CreateIndex
CREATE INDEX "subscription_referenceId_idx" ON "subscription"("referenceId");

-- CreateIndex
CREATE INDEX "subscription_status_idx" ON "subscription"("status");

-- CreateIndex
CREATE INDEX "subscription_stripeSubscriptionId_idx" ON "subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "subscription_periodEnd_idx" ON "subscription"("periodEnd");

-- CreateIndex
CREATE INDEX "template_organizationId_idx" ON "template"("organizationId");

-- CreateIndex
CREATE INDEX "template_category_idx" ON "template"("category");

-- CreateIndex
CREATE INDEX "template_isPublic_idx" ON "template"("isPublic");

-- CreateIndex
CREATE INDEX "template_deletedAt_idx" ON "template"("deletedAt");

-- CreateIndex
CREATE INDEX "template_version_templateId_idx" ON "template_version"("templateId");

-- CreateIndex
CREATE INDEX "template_version_createdAt_idx" ON "template_version"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "template_version_templateId_version_key" ON "template_version"("templateId", "version");

-- CreateIndex
CREATE INDEX "template_section_templateId_idx" ON "template_section"("templateId");

-- CreateIndex
CREATE INDEX "template_section_type_idx" ON "template_section"("type");

-- CreateIndex
CREATE INDEX "template_section_isReusable_idx" ON "template_section"("isReusable");

-- CreateIndex
CREATE INDEX "template_section_deletedAt_idx" ON "template_section"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "template_category_slug_key" ON "template_category"("slug");

-- CreateIndex
CREATE INDEX "template_category_slug_idx" ON "template_category"("slug");

-- CreateIndex
CREATE INDEX "template_category_deletedAt_idx" ON "template_category"("deletedAt");

-- CreateIndex
CREATE INDEX "template_category_relation_templateId_idx" ON "template_category_relation"("templateId");

-- CreateIndex
CREATE INDEX "template_category_relation_categoryId_idx" ON "template_category_relation"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "template_category_relation_templateId_categoryId_key" ON "template_category_relation"("templateId", "categoryId");

-- CreateIndex
CREATE INDEX "template_library_category_idx" ON "template_library"("category");

-- CreateIndex
CREATE INDEX "template_library_isPremium_idx" ON "template_library"("isPremium");

-- CreateIndex
CREATE INDEX "template_library_deletedAt_idx" ON "template_library"("deletedAt");

-- CreateIndex
CREATE INDEX "workspace_template_library_organizationId_idx" ON "workspace_template_library"("organizationId");

-- CreateIndex
CREATE INDEX "workspace_template_library_templateLibraryId_idx" ON "workspace_template_library"("templateLibraryId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_template_library_organizationId_templateLibraryId_key" ON "workspace_template_library"("organizationId", "templateLibraryId");

-- CreateIndex
CREATE INDEX "export_templateId_idx" ON "export"("templateId");

-- CreateIndex
CREATE INDEX "export_format_idx" ON "export"("format");

-- CreateIndex
CREATE INDEX "export_createdAt_idx" ON "export"("createdAt");

-- AddForeignKey
ALTER TABLE "generation_history" ADD CONSTRAINT "generation_history_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_history" ADD CONSTRAINT "generation_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_image" ADD CONSTRAINT "generated_image_generationHistoryId_fkey" FOREIGN KEY ("generationHistoryId") REFERENCES "generation_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_image" ADD CONSTRAINT "generated_image_parentImageId_fkey" FOREIGN KEY ("parentImageId") REFERENCES "generated_image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_prompt" ADD CONSTRAINT "ai_prompt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_prompt" ADD CONSTRAINT "ai_prompt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_quota" ADD CONSTRAINT "usage_quota_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_quota" ADD CONSTRAINT "usage_quota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration" ADD CONSTRAINT "integration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_sync" ADD CONSTRAINT "integration_sync_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_kit" ADD CONSTRAINT "brand_kit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template" ADD CONSTRAINT "template_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_version" ADD CONSTRAINT "template_version_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_section" ADD CONSTRAINT "template_section_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_category_relation" ADD CONSTRAINT "template_category_relation_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_category_relation" ADD CONSTRAINT "template_category_relation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "template_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_template_library" ADD CONSTRAINT "workspace_template_library_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_template_library" ADD CONSTRAINT "workspace_template_library_templateLibraryId_fkey" FOREIGN KEY ("templateLibraryId") REFERENCES "template_library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export" ADD CONSTRAINT "export_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

