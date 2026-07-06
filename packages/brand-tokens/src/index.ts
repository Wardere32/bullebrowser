export const product = {
  name: 'BulleBrowser',
  vendor: 'BulleBrowser',
  tagline: 'The browser that navigates for you',
  domain: 'bullebrowser.com',
  bundleId: 'com.bulleconsulting.bullebrowser',
  // Must match electron-builder.yml's `appId` exactly (case-sensitive) so the
  // runtime AppUserModelID lines up with the installer's — otherwise Windows
  // treats the running app as a second, ungrouped taskbar entry.
  appId: 'com.bulleconsulting.bullebrowser',
  windowTitle: 'BulleBrowser',
  splashText: 'BulleBrowser',
  contactEmail: 'hello@bulleconsulting.com',
} as const;

export const colors = {
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  accent: '#F59E0B',
  accentHover: '#D97706',
  surfaceDark: '#0F172A',
  surfaceLight: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textInverse: '#F8FAFC',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
} as const;

export const typography = {
  uiFont: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
  monoFont: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
  scale: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
} as const;

export const radii = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  pill: '9999px',
} as const;

export const spacing = {
  topBarHeight: 44,
  tabStripHeight: 36,
  aiPanelWidth: 440,
  sidePadding: 12,
} as const;

export type ColorToken = keyof typeof colors;
export type ProductInfo = typeof product;
