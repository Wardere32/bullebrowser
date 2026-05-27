// Address bar input parser. If the input looks like a hostname or URL we
// load it; otherwise we treat it as a search query.

const URL_LIKE = /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i;
const PROTOCOL = /^[a-z][a-z0-9+.-]*:\/\//i;

export function parseAddressBarInput(raw: string, searchEngine = 'bullebrowser'): string {
  const trimmed = raw.trim();
  if (!trimmed) return 'about:blank';
  if (PROTOCOL.test(trimmed)) return trimmed;
  if (trimmed.startsWith('localhost') || /^\d+\.\d+\.\d+\.\d+/.test(trimmed)) {
    return `http://${trimmed}`;
  }
  if (URL_LIKE.test(trimmed)) return `https://${trimmed}`;
  const query = encodeURIComponent(trimmed);
  switch (searchEngine) {
    case 'google':
      return `https://www.google.com/search?q=${query}`;
    case 'bing':
      return `https://www.bing.com/search?q=${query}`;
    case 'bullebrowser':
    default:
      return 'https://bullebrowser.com';
  }
}
