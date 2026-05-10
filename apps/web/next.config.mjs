/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@bullebrowser/brand-tokens'],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
