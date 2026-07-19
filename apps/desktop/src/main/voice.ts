// Voice transcription. One recorded clip in, text out, via the user's own
// OpenAI key (Whisper). Kept in main so the key never reaches the renderer and
// the network call sits behind the same trust boundary as the agent's.
//
// This is the whole voice backend: the renderer records with MediaRecorder and
// hands us the bytes; we return text the composer then sends as an ordinary
// prompt. Continuous Voice Mode is just this called repeatedly.

import { getApiKey } from './storage/secrets.js';

const ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';

// Map the recorder's container mime to a filename extension OpenAI accepts.
function extFor(mime: string): string {
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('mp4') || mime.includes('m4a')) return 'mp4';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  return 'webm';
}

export async function transcribeAudio(
  audio: ArrayBuffer | Uint8Array,
  mime: string,
): Promise<{ text: string }> {
  const key = getApiKey('openai');
  if (!key) {
    throw new Error(
      'Voice needs an OpenAI key. Add one in Settings, or connect an OpenAI ' +
        'model in the panel, then try again.',
    );
  }

  const bytes = audio instanceof Uint8Array ? audio : new Uint8Array(audio);
  if (bytes.byteLength === 0) return { text: '' };

  const type = mime || 'audio/webm';
  const form = new FormData();
  form.append('file', new Blob([bytes], { type }), `speech.${extFor(type)}`);
  form.append('model', 'whisper-1');
  form.append('response_format', 'json');

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => '');
    let detail = raw.slice(0, 300);
    try {
      const parsed = JSON.parse(raw) as { error?: { message?: string } };
      if (parsed.error?.message) detail = parsed.error.message;
    } catch {
      /* not JSON — use the raw slice */
    }
    if (res.status === 401) {
      throw new Error('OpenAI rejected the key used for voice (401). Check it in Settings.');
    }
    throw new Error(`Transcription failed (${res.status}). ${detail}`);
  }

  const json = (await res.json()) as { text?: string };
  return { text: (json.text ?? '').trim() };
}
