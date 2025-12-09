import type { NextConfig } from "next";
import path from "path";

// Import env here to validate during build
import "./src/env";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  serverExternalPackages: ["sharp"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "storage.mocah.ai",
      },
      {
        protocol: "https",
        hostname: "fly.storage.tigris.dev",
      },
      {
        protocol: "https",
        hostname: "mocah-user-brand-assets.fly.storage.tigris.dev",
      },
    ],
  },
};

export default nextConfig;
