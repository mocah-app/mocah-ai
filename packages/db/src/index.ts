import { PrismaClient } from "../prisma/generated/client";
const prisma = new PrismaClient();

export default prisma;

// Re-export ALL Prisma generated types and enums
export * from "../prisma/generated/client";
export * from "../prisma/generated/enums";
export * from "../prisma/generated/models";

// Explicit type exports for PrismaClient
export type { PrismaClient } from "../prisma/generated/client";
