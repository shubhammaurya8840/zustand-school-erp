import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  turbopack: {
    resolveAlias: {
      "framer-motion": "./src/lib/framer-motion.tsx",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "framer-motion": path.resolve(__dirname, "src/lib/framer-motion.tsx"),
    };
    return config;
  },
};

export default nextConfig;
