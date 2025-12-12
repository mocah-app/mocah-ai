import { PrismaClient } from "./generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manually load DATABASE_URL from .env file
// Path: packages/db/prisma -> packages/db -> packages -> root -> apps/web/.env
const envPath = path.resolve(__dirname, "../../../apps/web/.env");
const envContent = readFileSync(envPath, "utf-8");
const dbUrlMatch = envContent.match(/^DATABASE_URL=(.*)$/m);

if (!dbUrlMatch || !dbUrlMatch[1]) {
  throw new Error("DATABASE_URL not found in .env file");
}

const adapter = new PrismaPg({
  connectionString: dbUrlMatch[1].trim().replace(/['"]/g, ""),
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Seed template categories
  const categories = [
    {
      name: "Welcome Series",
      slug: "welcome-series",
      description: "Welcome and onboarding email sequences",
    },
    {
      name: "E-commerce",
      slug: "ecommerce",
      description: "Product promotions, cart abandonment, and order confirmations",
    },
    {
      name: "Newsletter",
      slug: "newsletter",
      description: "Regular updates and content newsletters",
    },
    {
      name: "Promotional",
      slug: "promotional",
      description: "Sales, offers, and special promotions",
    },
    {
      name: "Transactional",
      slug: "transactional",
      description: "Order confirmations, shipping updates, and receipts",
    },
    {
      name: "Announcement",
      slug: "announcement",
      description: "Product launches and company updates",
    },
    {
      name: "Event",
      slug: "event",
      description: "Event invitations and reminders",
    },
    {
      name: "Educational",
      slug: "educational",
      description: "Tips, tutorials, and educational content",
    },
  ];

  console.log("📂 Creating template categories...");
  for (const category of categories) {
    await prisma.templateCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
    console.log(`  ✓ ${category.name}`);
  }

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
