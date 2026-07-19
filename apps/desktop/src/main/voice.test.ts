import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The stored OpenAI key, swapped per test.
let apiKey: string | null = 'sk-test';

vi.mock('./storage/secrets.js', () => ({
  getApiKey: (provider?: string) => (provider === 'openai' ? apiKey : null),
}));

const { transcribeAudio } = await import('./voice.js');

const AUDIO = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

type FetchImpl = (url: string, init: RequestInit) => Promise<Response> | Response;

function mockFetch(impl: FetchImpl) {
  const fn = vi.fn<FetchImpl>(impl);
  vi.stubGlobal('fetch', fn);
  return fn;
}

const ok = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

beforeEach(() => {
  apiKey = 'sk-test';
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('transcribeAudio', () => {
  it('returns the transcript on success', async () => {
    mockFetch(() => ok({ text: '  open the pricing page  ' }));
    const { text } = await transcribeAudio(AUDIO, 'audio/webm');
    expect(text).toBe('open the pricing page');
  });

  it('sends the key as a bearer token to the transcription endpoint', async () => {
    const fetchMock = mockFetch(() => ok({ text: 'hi' }));
    await transcribeAudio(AUDIO, 'audio/webm');

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain('/audio/transcriptions');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk-test');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
  });

  it('accepts an ArrayBuffer as well as a view', async () => {
    mockFetch(() => ok({ text: 'buffered' }));
    const { text } = await transcribeAudio(AUDIO.buffer as ArrayBuffer, 'audio/webm');
    expect(text).toBe('buffered');
  });

  // A user with no OpenAI key must get a instruction, not a raw 401.
  it('explains what to do when no OpenAI key is stored, without calling out', async () => {
    apiKey = null;
    const fetchMock = mockFetch(() => ok({ text: 'never' }));
    await expect(transcribeAudio(AUDIO, 'audio/webm')).rejects.toThrow(/OpenAI key/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('short-circuits empty audio instead of posting an empty clip', async () => {
    const fetchMock = mockFetch(() => ok({ text: 'never' }));
    const { text } = await transcribeAudio(new Uint8Array(0), 'audio/webm');
    expect(text).toBe('');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps a 401 to a key-specific message', async () => {
    mockFetch(() => new Response('unauthorized', { status: 401 }));
    await expect(transcribeAudio(AUDIO, 'audio/webm')).rejects.toThrow(/rejected the key/i);
  });

  it('surfaces the provider error message from a JSON error body', async () => {
    mockFetch(
      () =>
        new Response(JSON.stringify({ error: { message: 'audio too short' } }), { status: 400 }),
    );
    await expect(transcribeAudio(AUDIO, 'audio/webm')).rejects.toThrow(/audio too short/);
  });

  it('still reports something useful when the error body is not JSON', async () => {
    mockFetch(() => new Response('<html>gateway timeout</html>', { status: 504 }));
    await expect(transcribeAudio(AUDIO, 'audio/webm')).rejects.toThrow(/504/);
  });

  it('tolerates a success body with no text field', async () => {
    mockFetch(() => ok({}));
    const { text } = await transcribeAudio(AUDIO, 'audio/webm');
    expect(text).toBe('');
  });
});
