// Static export for GitHub Pages. No server runtime: OS detection and
// latest-release lookup happen client-side against the GitHub API.
//
// NEXT_PUBLIC_BASE_PATH lets the same build serve either from a custom
// domain at the root ('') or from the project Pages URL ('/bullebrowser').
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@bullebrowser/brand-tokens'],
  images: { unoptimized: true },
  trailingSlash: true,
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
