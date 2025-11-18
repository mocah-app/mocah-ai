import { PrismaClient, Prisma } from "../prisma/generated/client";

const prisma = new PrismaClient();

export default prisma;
export { PrismaClient, Prisma };
export type * from "../prisma/generated/client";
