const withNextIntl = require('next-intl/plugin')('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Disable static optimization for i18n routes
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sabirov.tech',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // Проксируем API запросы на бекенд
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.BACKEND_URL 
          ? `${process.env.BACKEND_URL}/api/:path*`
          : 'http://backend:8000/api/:path*',
      },
    ];
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['framer-motion', 'react-intersection-observer'],
  },
};

module.exports = withNextIntl(nextConfig);
