// Address bar input parser. Decides whether the user typed a URL, a
// search query that should go through a stock search engine, or a free-
// form task that should be sent to the BulleBrowser agent.

const URL_LIKE = /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i;
const PROTOCOL = /^[a-z][a-z0-9+.-]*:\/\//i;

export type AddressBarAction =
  | { type: 'url'; url: string }
  | { type: 'agent'; prompt: string };

export function parseAddressBarInput(
  raw: string,
  searchEngine = 'bullebrowser',
): AddressBarAction {
  const trimmed = raw.trim();
  if (!trimmed) return { type: 'url', url: 'about:blank' };
  if (PROTOCOL.test(trimmed)) return { type: 'url', url: trimmed };
  if (trimmed.startsWith('localhost') || /^\d+\.\d+\.\d+\.\d+/.test(trimmed)) {
    return { type: 'url', url: `http://${trimmed}` };
  }
  if (URL_LIKE.test(trimmed)) return { type: 'url', url: `https://${trimmed}` };
  const query = encodeURIComponent(trimmed);
  switch (searchEngine) {
    case 'google':
      return { type: 'url', url: `https://www.google.com/search?q=${query}` };
    case 'bing':
      return { type: 'url', url: `https://www.bing.com/search?q=${query}` };
    case 'bullebrowser':
    default:
      // The BulleBrowser "search engine" is the agent itself — typing a
      // task into the address bar is the same as asking the AI panel.
      return { type: 'agent', prompt: trimmed };
  }
}

/** Event dispatched by the address bar when the user submits an agent prompt. */
export const AGENT_PROMPT_EVENT = 'bullebrowser:agent-prompt';
