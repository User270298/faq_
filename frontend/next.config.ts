import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Убираем для поддержки API routes
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Убираем rewrites для статического экспорта
  assetPrefix: '',

};

export default nextConfig;
