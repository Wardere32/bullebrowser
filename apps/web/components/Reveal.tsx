'use client';

import { useEffect, useRef, useState } from 'react';

// Fade-in-up as the element scrolls into view — the reference site's entrance
// motion. Content is never hidden without JS: the animation simply plays once
// when revealed, and is skipped entirely under prefers-reduced-motion (CSS).
export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setPlay(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setPlay(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ animationDelay: `${delay}ms` }}
      className={`${className} ${play ? 'animate-fade-in-up' : ''}`}
    >
      {children}
    </div>
  );
}
