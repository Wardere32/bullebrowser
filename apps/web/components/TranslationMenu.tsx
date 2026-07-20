'use client';

// The Translation control in the top bar. The label itself tickers across a
// fixed-width window at a steady, readable pace, and opens a language list with
// each country's flag beside it.
//
// Choosing a language records the preference and sets the document language,
// which is what assistive tech and the browser's own translation prompt read.
// The page copy itself is not translated yet: that needs a content layer, and
// wiring one is a separate piece of work.

import { useEffect, useRef, useState } from 'react';

interface Language {
  code: string;
  label: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'so', label: 'Soomaali', flag: '🇸🇴' },
  { code: 'sw', label: 'Kiswahili', flag: '🇰🇪' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
];

const STORAGE_KEY = 'bullebrowser:lang';

export function TranslationMenu() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Language>(LANGUAGES[0]!);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const found = LANGUAGES.find((l) => l.code === saved);
    if (found) setActive(found);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (lang: Language) => {
    setActive(lang);
    setOpen(false);
    window.localStorage.setItem(STORAGE_KEY, lang.code);
    document.documentElement.lang = lang.code;
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Translation"
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-ink-secondary transition-colors hover:text-ink-primary"
      >
        <span aria-hidden>{active.flag}</span>
        {/* Fixed window the label scrolls through, so the bar never reflows. */}
        <span className="ticker-window" aria-hidden>
          <span className="ticker-track">Translation</span>
        </span>
        <span className="sr-only">Translation</span>
        <svg
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Choose a language"
          className="absolute right-0 top-full z-50 mt-2 max-h-80 w-52 overflow-y-auto rounded-xl border border-line bg-surface-light p-1 shadow-xl"
        >
          {LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                role="option"
                aria-selected={lang.code === active.code}
                onClick={() => choose(lang)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  lang.code === active.code
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-ink-primary hover:bg-surface-muted'
                }`}
              >
                <span className="text-base" aria-hidden>
                  {lang.flag}
                </span>
                {lang.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
