'use client';

// The hero walkthrough player. It shows a framed poster with a play control,
// integrated into the hero the way Comet leads with a product film.
//
// Honesty note: the marketing repo ships NO video file yet, so by default this
// is a poster that links to /preview (the real, captured product screens)
// rather than a fake player. The moment a walkthrough is exported to
// /public/walkthrough.mp4, pass `src="/walkthrough.mp4"` and the same frame
// becomes a real inline <video> — no other change needed. Self-hosted media
// plays fine under the site's `default-src 'self'` CSP.

import { useRef, useState } from 'react';
import Link from 'next/link';
import { asset } from '@/lib/asset';

interface Props {
  /** Optional self-hosted clip, e.g. "/walkthrough.mp4". Omit until one exists. */
  src?: string;
  /** Poster frame shown before playback. Defaults to the first-launch screenshot. */
  poster?: string;
  label?: string;
}

export function VideoGuide({
  src,
  poster = '/screenshots/first-open.png',
  label = 'Watch the 90-second walkthrough',
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const frame =
    'group relative block aspect-video w-full overflow-hidden rounded-xl border border-line bg-surface-dark shadow-lg ring-1 ring-black/5';

  // With a real clip: an inline player that starts on click.
  if (src) {
    return (
      <div className={frame}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          poster={asset(poster)}
          controls={playing}
          preload="none"
          playsInline
        >
          <source src={asset(src)} type="video/mp4" />
        </video>
        {!playing && (
          <button
            type="button"
            aria-label={label}
            onClick={() => {
              setPlaying(true);
              videoRef.current?.play();
            }}
            className="absolute inset-0 flex items-center justify-center bg-ink-primary/20 transition-colors group-hover:bg-ink-primary/10"
          >
            <PlayBadge label={label} />
          </button>
        )}
      </div>
    );
  }

  // No clip yet: the poster becomes a tasteful entry point to the real screens.
  return (
    <Link href="/preview" aria-label={label} className={frame}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset(poster)}
        alt="BulleBrowser in action"
        className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-[1.02]"
        draggable={false}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-ink-primary/45 via-ink-primary/10 to-transparent">
        <PlayBadge label={label} />
      </div>
    </Link>
  );
}

function PlayBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-3 rounded-full bg-white/95 py-2 pl-2.5 pr-5 text-sm font-medium text-ink-primary shadow-lg backdrop-blur transition-transform group-hover:scale-[1.03]">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
        <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M8 5.5v13l11-6.5z" />
        </svg>
      </span>
      {label}
    </span>
  );
}
