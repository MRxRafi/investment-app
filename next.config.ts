import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  serverExternalPackages: ['yahoo-finance2'],
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
