/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // パフォーマンス最適化
  poweredByHeader: false,
  // 本番環境でのソースマップ無効化
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
