import type { ExecutionPlan } from './types.js';

function detectUrl(text: string): string | null {
  const m = text.match(/https?:\/\/\S+/i);
  return m ? m[0].replace(/[),.;]+$/, '') : null;
}

function detectQuoted(text: string): string | null {
  const m = text.match(/"([^"]+)"|'([^']+)'/);
  return m?.[1] ?? m?.[2] ?? null;
}

export interface PlannerInput {
  userMessage: string;
  currentUrl?: string;
}

export function planTask(input: PlannerInput): ExecutionPlan {
  const message = input.userMessage.trim();
  const lower = message.toLowerCase();
  const url = detectUrl(message);
  const quoted = detectQuoted(message);

  if (url && /(open|go to|navigate)/i.test(lower)) {
    return {
      goal: `Navigate to ${url}`,
      rationale: 'User requested navigation to a specific URL.',
      steps: [
        {
          id: 'step-1',
          toolName: 'navigate',
          input: { url },
          expected: 'Active tab should load target URL.',
        },
        {
          id: 'step-2',
          toolName: 'getPageMetadata',
          input: {},
          expected: 'Return title and canonical URL after navigation.',
        },
      ],
    };
  }

  if (/(list tabs|show tabs|what tabs)/i.test(lower)) {
    return {
      goal: 'List open browser tabs',
      rationale: 'User asked for tab inventory.',
      steps: [
        {
          id: 'step-1',
          toolName: 'listTabs',
          input: {},
          expected: 'Return all tabs with title and URL.',
        },
      ],
    };
  }

  if (/(metadata|title|url of this page)/i.test(lower)) {
    return {
      goal: 'Fetch page metadata',
      rationale: 'User asked for title/url context.',
      steps: [
        {
          id: 'step-1',
          toolName: 'getPageMetadata',
          input: {},
          expected: 'Return active tab title and URL.',
        },
      ],
    };
  }

  if (/(extract|structured|json)/i.test(lower)) {
    return {
      goal: 'Extract structured data from the page',
      rationale: 'User asked for structured extraction.',
      steps: [
        {
          id: 'step-1',
          toolName: 'extractStructuredData',
          input: {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                keyPoints: { type: 'array', items: { type: 'string' } },
              },
              required: ['title'],
            },
          },
          expected: 'Return schema-shaped extraction output.',
        },
      ],
    };
  }

  if (/(click|tap|press)/i.test(lower) && quoted) {
    return {
      goal: `Click target ${quoted}`,
      rationale: 'User explicitly asked to click a target.',
      steps: [
        {
          id: 'step-1',
          toolName: 'clickElement',
          input: { target: quoted },
          expected: 'Target element should be clicked.',
        },
      ],
    };
  }

  if (/(type|fill|enter)/i.test(lower) && quoted) {
    return {
      goal: 'Type into a page field',
      rationale: 'User requested text entry with explicit target/text.',
      steps: [
        {
          id: 'step-1',
          toolName: 'typeIntoField',
          input: { target: quoted, text: message },
          expected: 'Text should be entered in matched field.',
        },
      ],
    };
  }

  return {
    goal: 'Summarize active page safely',
    rationale: 'Default local-first behavior: inspect current page then summarize.',
    steps: [
      {
        id: 'step-1',
        toolName: 'getPageText',
        input: {},
        expected: 'Readable page text must be retrieved.',
      },
      {
        id: 'step-2',
        toolName: 'summarizePage',
        input: {},
        expected: 'Summary should capture key points with source URL citation.',
      },
    ],
  };
}
