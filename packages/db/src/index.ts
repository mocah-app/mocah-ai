import { PrismaClient } from "../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { serverEnv } from "@mocah/config/env";

const adapter = new PrismaPg({
	connectionString: serverEnv.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

export default prisma;

// Re-export ALL Prisma generated types and enums
export * from "../prisma/generated/client";
export * from "../prisma/generated/enums";
export * from "../prisma/generated/models";

// Explicit type exports for PrismaClient
export type { PrismaClient } from "../prisma/generated/client";
