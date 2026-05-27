import { DEFAULT_SETTINGS, type AppSettings } from '../../shared/ipc.js';
import { createStore } from './store.js';

const store = createStore<AppSettings & Record<string, unknown>>(
  'settings',
  DEFAULT_SETTINGS as AppSettings & Record<string, unknown>,
);

export function getSettings(): AppSettings {
  const storedSearchProvider = store.get('searchProvider') as string | undefined;
  const storedHomepageUrl = store.get('homepageUrl') as string | undefined;

  const allowedSearchProviders: AppSettings['searchProvider'][] = [
    'bullebrowser',
    'google',
    'bing',
  ];

  const resolvedSearchProvider = allowedSearchProviders.includes(
    storedSearchProvider as AppSettings['searchProvider'],
  )
    ? (storedSearchProvider as AppSettings['searchProvider'])
    : DEFAULT_SETTINGS.searchProvider;

  const normalizedHomepageUrl =
    storedHomepageUrl === 'https://bullebrowser.com/preview' ||
    !storedHomepageUrl?.trim()
      ? DEFAULT_SETTINGS.homepageUrl
      : storedHomepageUrl;

  return {
    defaultModel: store.get('defaultModel'),
    aiPanelOpen: store.get('aiPanelOpen'),
    searchProvider: resolvedSearchProvider,
    homepageUrl: normalizedHomepageUrl ?? DEFAULT_SETTINGS.homepageUrl,
    complianceChecklist: store.get('complianceChecklist'),
  };
}

export function setSettings(patch: Partial<AppSettings>): AppSettings {
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) {
      (store as unknown as { set: (k: string, v: unknown) => void }).set(k, v);
    }
  }
  return getSettings();
}
