'use client';

// The Translation control in the top bar. It shows just the active language's
// flag and a chevron — no label, no ticker — and opens a language list with
// each country's flag beside it. The accessible name stays "Translation".
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
  dir: 'ltr' | 'rtl';
}

const LANGUAGES: Language[] = [
  { code: 'en', label: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  // Latin American Spanish: the variety the great majority of the world's
  // Spanish speakers use, and neutral across the region.
  { code: 'es-419', label: 'Español', flag: '🇲🇽', dir: 'ltr' },
  // European Portuguese as the formal standard, readable to speakers in
  // Portugal, Brazil and lusophone Africa alike.
  { code: 'pt-PT', label: 'Português', flag: '🇵🇹', dir: 'ltr' },
];

const STORAGE_KEY = 'bullebrowser:lang';

export function TranslationMenu() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Language>(LANGUAGES[0]!);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const found = LANGUAGES.find((l) => l.code === saved);
    if (found) {
      setActive(found);
      document.documentElement.lang = found.code;
      document.documentElement.dir = found.dir;
    }
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
    window.dispatchEvent(new CustomEvent('bullebrowser:locale', { detail: lang.code }));
    document.documentElement.lang = lang.code;
    document.documentElement.dir = lang.dir;
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
        <span className="text-base leading-none" aria-hidden>{active.flag}</span>
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
