/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Docker用の最適化ビルド
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;
