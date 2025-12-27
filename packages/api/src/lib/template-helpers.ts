/**
 * Shared utility functions for template operations
 * Consolidates common patterns to reduce redundancy across template routers
 */

import type { PrismaClient } from "@mocah/db";
import { TRPCError } from "@trpc/server";
import { checkMembership } from "./membership-cache";
import { repairHtmlTags } from "./html-tag-repair";
import { validateReactEmailCode, logger } from "@mocah/shared";
import { serverEnv } from "@mocah/config/env";

// Valid style type values for templates
export const VALID_STYLE_TYPES = ["INLINE", "PREDEFINED_CLASSES", "STYLE_OBJECTS"] as const;
export type StyleType = (typeof VALID_STYLE_TYPES)[number];

/**
 * Validates and normalizes a style type string to a valid StyleType.
 * Uppercases the input, checks membership, logs warning and returns default if invalid.
 */
export function validateStyleType(styleType: string): StyleType {
  const uppercased = styleType.toUpperCase();
  if (VALID_STYLE_TYPES.includes(uppercased as StyleType)) {
    return uppercased as StyleType;
  }
  logger.warn(`⚠️ Invalid styleType "${styleType}", defaulting to STYLE_OBJECTS`);
  return "STYLE_OBJECTS";
}

/**
 * Options for verifyTemplateAccess
 */
export interface VerifyTemplateAccessOptions {
  include?: Record<string, any>;
  allowPublic?: boolean;
}

/**
 * Verifies user has access to a template and returns it.
 * Consolidates the repeated pattern: find template → check membership → throw if not found/forbidden
 * 
 * @param db - Prisma client
 * @param userId - User ID to verify access for
 * @param templateId - Template ID to check
 * @param options - Optional includes and access settings
 * @returns Template with optional includes
 * @throws TRPCError with NOT_FOUND or FORBIDDEN
 */
export async function verifyTemplateAccess<T = any>(
  db: PrismaClient,
  userId: string,
  templateId: string,
  options?: VerifyTemplateAccessOptions
): Promise<T> {
  const template = await db.template.findUnique({
    where: { id: templateId },
    include: options?.include,
  });

  if (!template) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Template not found",
    });
  }

  // For public templates, allow access without membership check
  if (options?.allowPublic && template.isPublic) {
    return template as T;
  }

  const isMember = await checkMembership(db, userId, template.organizationId);

  if (!isMember) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this template",
    });
  }

  return template as T;
}

/**
 * Data for creating an initial version
 */
export interface CreateInitialVersionData {
  templateId: string;
  version: number;
  name: string;
  subject?: string | null;
  reactEmailCode: string;
  styleType: StyleType;
  styleDefinitions?: any;
  previewText?: string | null;
  htmlCode?: string | null;
  tableHtmlCode?: string | null;
  metadata?: any;
  isCurrent?: boolean;
}

/**
 * Creates an initial version for a template and updates template.currentVersionId.
 * Consolidates the version creation pattern used in create, generate, regenerate, duplicate.
 * 
 * @param db - Prisma client
 * @param versionData - Version data to create
 * @param userId - User ID creating the version
 * @returns Created version
 */
export async function createInitialVersion(
  db: PrismaClient,
  versionData: CreateInitialVersionData,
  userId: string | null | undefined
) {
  const version = await db.templateVersion.create({
    data: {
      templateId: versionData.templateId,
      version: versionData.version,
      name: versionData.name,
      subject: versionData.subject,
      isCurrent: versionData.isCurrent ?? true,
      createdBy: userId,
      reactEmailCode: versionData.reactEmailCode,
      styleType: versionData.styleType,
      styleDefinitions: versionData.styleDefinitions,
      previewText: versionData.previewText,
      htmlCode: versionData.htmlCode,
      tableHtmlCode: versionData.tableHtmlCode,
      metadata: versionData.metadata,
    },
  });

  // Update template with current version
  await db.template.update({
    where: { id: versionData.templateId },
    data: { currentVersionId: version.id },
  });

  return version;
}

/**
 * Result of code validation and repair
 */
export interface ValidateAndRepairResult {
  code: string;
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  changed: boolean;
}

/**
 * Validates and repairs React Email code.
 * Consolidates repairHtmlTags + validateReactEmailCode pattern.
 * 
 * @param code - React Email code to validate and repair
 * @returns Validation result with repaired code
 */
export function validateAndRepairCode(code: string): ValidateAndRepairResult {
  // Auto-repair HTML tags before validation
  const repairResult = repairHtmlTags(code);
  const repairedCode = repairResult.changed ? repairResult.code : code;

  if (repairResult.changed) {
    logger.info("🔧 Auto-repaired HTML tags in AI output", {
      originalLength: code.length,
      repairedLength: repairedCode.length,
      changeCount: repairResult.changeCount,
    });
  }

  // Validate repaired code
  const validation = validateReactEmailCode(repairedCode);

  return {
    code: repairedCode,
    isValid: validation.isValid,
    errors: validation.errors || [],
    warnings: validation.warnings,
    changed: repairResult.changed,
  };
}

/**
 * Checks if user has permission to publish templates to library.
 * Consolidates publisher email check logic.
 * 
 * @param userEmail - User email to check
 * @returns true if user can publish, false otherwise
 */
export function checkPublisherPermission(userEmail: string): boolean {
  const publisherEmails = serverEnv.TEMPLATE_PUBLISHER_EMAILS || "";
  const allowedEmails = publisherEmails
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return allowedEmails.includes(userEmail.toLowerCase());
}

/**
 * Verifies user owns a library entry and returns it with source template.
 * Consolidates library entry ownership verification pattern.
 * 
 * @param db - Prisma client
 * @param userId - User ID to verify ownership for
 * @param libraryId - Library entry ID to check
 * @returns Library entry with source template
 * @throws TRPCError with NOT_FOUND or FORBIDDEN
 */
export async function verifyLibraryEntryOwnership(
  db: PrismaClient,
  userId: string,
  libraryId: string
) {
  const libraryEntry = await db.templateLibrary.findUnique({
    where: { id: libraryId },
    include: {
      sourceTemplate: true,
      _count: {
        select: {
          customizations: true,
        },
      },
    },
  });

  if (!libraryEntry) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Library entry not found",
    });
  }

  if (!libraryEntry.sourceTemplate) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Source template not found",
    });
  }

  const isMember = await checkMembership(
    db,
    userId,
    libraryEntry.sourceTemplate.organizationId
  );

  if (!isMember) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this library entry",
    });
  }

  return libraryEntry;
}

