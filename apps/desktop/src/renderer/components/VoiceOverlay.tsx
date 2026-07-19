import { useEffect, useRef, useState } from 'react';

// Voice input overlay for the AI panel. Two modes share one implementation:
//
//   • 'once'       — the mic button. Record a single utterance; on stop,
//                    transcribe and hand the text back (the panel sends it).
//   • 'continuous' — the soundwave button (Voice Mode). Keep listening, and
//                    each time speech is followed by a beat of silence, cut a
//                    segment, transcribe it, and emit it — so the user can keep
//                    giving commands without pressing anything. Clicking the
//                    soundwave icon again closes this overlay.
//
// The soundwave reacts to the real mic level via a Web Audio AnalyserNode.
// Transcription itself is done in main (OpenAI Whisper, the user's key) — this
// component only records and visualises. It renders INSIDE the AI panel (a
// renderer-chrome region); a full-window overlay would be hidden behind the
// browser view, which the OS paints on top of the page area.

const BARS = 7;
const SPEECH_ON = 0.06; // amplitude above which we treat it as speech
const SILENCE_MS = 1100; // trailing silence that ends a continuous segment
const MIN_CLIP_BYTES = 1400; // ignore near-empty blobs (a click, a breath)

type Status = 'connecting' | 'listening' | 'transcribing' | 'error';

function bridge(): any {
  return (window as unknown as { bullebrowser: any }).bullebrowser;
}

export function VoiceOverlay({
  mode,
  onTranscript,
  onClose,
}: {
  mode: 'once' | 'continuous';
  onTranscript: (text: string) => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<Status>('connecting');
  const [error, setError] = useState('');
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0.25));

  // The live bar transforms and the pulsing dot are animations in their own
  // right; the CSS media query only silences the idle fallback keyframes.
  const reduceMotion =
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const rafRef = useRef<number>(0);
  const closedRef = useRef(false);
  const mimeRef = useRef('audio/webm');

  // Continuous-mode voice-activity state.
  const hadSpeechRef = useRef(false);
  const silenceStartRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    // A previous session (e.g. switching mic → Voice Mode without unmounting)
    // left this true on cleanup; reset it or this session is dead on arrival.
    closedRef.current = false;

    // Tear the mic/loop down WITHOUT unmounting, so an unrecoverable error can
    // stop everything while the overlay stays up showing what went wrong.
    // Idempotent; also used by the unmount cleanup.
    const stopEverything = () => {
      closedRef.current = true;
      cancelAnimationFrame(rafRef.current);
      try {
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
          recorderRef.current.stop();
        }
      } catch {
        /* already stopped */
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      void audioCtxRef.current?.close().catch(() => {});
    };

    const pickMime = () => {
      const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      for (const c of candidates) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c;
      }
      return 'audio/webm';
    };

    const startRecorder = () => {
      const stream = streamRef.current;
      if (!stream || closedRef.current) return;
      chunksRef.current = [];
      const rec = new MediaRecorder(stream, { mimeType: mimeRef.current });
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeRef.current });
        chunksRef.current = [];
        // Continuous: resume listening immediately so we don't miss the next
        // command while the last segment transcribes in the background.
        if (mode === 'continuous' && !closedRef.current) startRecorder();
        void transcribe(blob);
      };
      rec.start();
      recorderRef.current = rec;
      hadSpeechRef.current = false;
      silenceStartRef.current = null;
    };

    const transcribe = async (blob: Blob) => {
      if (closedRef.current) return;
      if (blob.size < MIN_CLIP_BYTES) {
        if (mode === 'once') finish();
        return;
      }
      // Only the one-shot flow is actually blocked on transcription. Continuous
      // has already resumed recording by now, so showing "Transcribing…" there
      // would freeze the wave while the mic is in fact live.
      if (mode === 'once') setStatus('transcribing');
      try {
        const buf = await blob.arrayBuffer();
        const { text } = await bridge().voice.transcribe(buf, blob.type || 'audio/webm');
        if (text && !closedRef.current) onTranscript(text);
      } catch (e) {
        if (closedRef.current) return;
        // Stop the whole session on failure. Continuous mode has already
        // restarted the recorder, so without this a bad key or a dropped
        // network would keep the mic hot and retry forever.
        stopEverything();
        setError(e instanceof Error ? e.message : 'Could not transcribe that.');
        setStatus('error');
        return;
      }
      if (mode === 'once') finish();
      else if (!closedRef.current) setStatus('listening');
    };

    const meter = () => {
      const analyser = analyserRef.current;
      if (!analyser) return;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (closedRef.current) return;
        analyser.getByteFrequencyData(data);
        // Split the spectrum into BARS bands; each bar is that band's energy.
        const band = Math.floor(data.length / BARS);
        const next: number[] = [];
        let sum = 0;
        for (let b = 0; b < BARS; b++) {
          let acc = 0;
          for (let i = 0; i < band; i++) acc += data[b * band + i] ?? 0;
          const v = acc / band / 255; // 0..1
          next.push(Math.max(0.12, Math.min(1, v * 1.6)));
          sum += v;
        }
        const amp = sum / BARS;
        setLevels(next);

        // Continuous VAD: end a segment on trailing silence after speech.
        if (mode === 'continuous' && recorderRef.current?.state === 'recording') {
          const now = performance.now();
          if (amp > SPEECH_ON) {
            hadSpeechRef.current = true;
            silenceStartRef.current = null;
          } else if (hadSpeechRef.current) {
            if (silenceStartRef.current == null) silenceStartRef.current = now;
            else if (now - silenceStartRef.current > SILENCE_MS) {
              recorderRef.current.stop(); // → onstop → transcribe + restart
            }
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    };

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        mimeRef.current = pickMime();
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;
        ctx.createMediaStreamSource(stream).connect(analyser);
        analyserRef.current = analyser;
        setStatus('listening');
        meter();
        startRecorder();
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error && /denied|not allowed/i.test(e.message)
              ? 'Microphone access was blocked. Allow it to use voice.'
              : 'No microphone available.',
          );
          setStatus('error');
        }
      }
    })();

    // Cleanup runs on unmount OR when the user stops. Idempotent.
    function finish() {
      if (closedRef.current) return;
      closedRef.current = true;
      onClose();
    }
    return () => {
      cancelled = true;
      stopEverything();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // The mic button: stop recording now and transcribe what we have.
  const stopOnce = () => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
    else onClose();
  };

  const label =
    status === 'connecting'
      ? 'Starting microphone…'
      : status === 'transcribing'
        ? 'Transcribing…'
        : status === 'error'
          ? error
          : mode === 'continuous'
            ? 'Listening… speak your commands'
            : 'Listening… speak, then Send';

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-surface-light/95 backdrop-blur-sm">
      <div className="flex w-[80%] max-w-xs flex-col items-center gap-6 rounded-2xl border border-line/40 bg-white p-6 shadow-xl">
        <div
          className={`bb-wave ${status === 'listening' ? '' : 'bb-wave--idle'} ${
            mode === 'continuous' ? 'text-primary' : 'text-ink-primary'
          }`}
          aria-hidden
        >
          {levels.map((l, i) => (
            <span
              key={i}
              className="bb-wave-bar"
              style={
                status === 'listening' && !reduceMotion
                  ? { transform: `scaleY(${l.toFixed(3)})` }
                  : undefined
              }
            />
          ))}
        </div>

        <div
          className={`min-h-[2.5rem] px-2 text-center text-[13px] ${
            status === 'error' ? 'text-danger' : 'text-ink-secondary'
          }`}
        >
          {mode === 'continuous' && status === 'listening' && (
            <span className="mb-1 flex items-center justify-center gap-1.5 text-primary">
              <span
                className="h-1.5 w-1.5 rounded-full bg-primary"
                style={reduceMotion ? undefined : { animation: 'soft-pulse 1.4s ease-in-out infinite' }}
              />
              Voice Mode
            </span>
          )}
          {label}
        </div>

        <div className="flex items-center gap-2">
          {mode === 'once' && status !== 'error' && (
            <button
              type="button"
              onClick={stopOnce}
              disabled={status === 'connecting' || status === 'transcribing'}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {status === 'transcribing' ? 'Working…' : 'Send'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line px-4 py-1.5 text-sm text-ink-secondary hover:bg-surface-muted"
          >
            {mode === 'continuous' ? 'Stop Voice Mode' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
