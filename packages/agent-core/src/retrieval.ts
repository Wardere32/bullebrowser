import type { ToolContext } from './types.js';
import type { MemoryStore } from './memory.js';

export interface RetrievedContext {
  url?: string;
  title?: string;
  textSnippet?: string;
  memory: Record<string, unknown>;
}

export async function retrieveContext(
  context: ToolContext,
  memory: MemoryStore,
): Promise<RetrievedContext> {
  try {
    const page = await context.runtime.readPage(context.activeTabId);
    return {
      url: page.url,
      title: page.title,
      textSnippet: page.text.slice(0, 8000),
      memory: memory.all(),
    };
  } catch {
    return {
      memory: memory.all(),
    };
  }
}
