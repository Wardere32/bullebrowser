// Prefix for static assets in /public when the site is served from a
// non-root base path (the GitHub Pages project URL, /bullebrowser).
// Next rewrites <Link> hrefs and _next/* automatically, but not raw
// <img src> or other public asset references, so we prefix those manually.
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const asset = (p: string): string =>
  `${basePath}${p.startsWith('/') ? p : `/${p}`}`;
