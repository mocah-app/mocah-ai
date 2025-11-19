import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "fly.storage.tigris.dev",
      },
    ],
  // },
  // // Monorepo: trace from workspace root
  // outputFileTracingRoot: path.join(__dirname, "../../"),
  // // Ensure Prisma engine is included in serverless bundle
  // outputFileTracingIncludes: {
  //   "/api/**/*": [
  //     "../../packages/db/prisma/generated/**/*",
  //   ],
  //   "/**/*": [
  //     "../../packages/db/prisma/generated/**/*",
  //   ],
  // 
  },
};

export default nextConfig;
