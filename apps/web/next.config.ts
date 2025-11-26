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
        hostname: "storage.mocah.ai",
      },
      {
        protocol: "https",
        hostname: "fly.storage.tigris.dev",
      },
    ],
  },
};

export default nextConfig;
