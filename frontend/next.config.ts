import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Включаем статический экспорт
  trailingSlash: true, // Добавляем trailing slash для статических файлов
  images: {
    unoptimized: true, // Отключаем оптимизацию изображений для статического экспорта
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
