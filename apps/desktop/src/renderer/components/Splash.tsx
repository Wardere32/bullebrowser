import { product } from '@bullebrowser/brand-tokens';
import wordmarkLight from '@bullebrowser/brand-tokens/wordmark-light.png';

export function Splash() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-surface-dark px-12 text-ink-inverse">
      {/* The shine is a gradient sweep masked to the logo's own alpha, so it
          travels across the mark itself rather than a rectangle around it —
          hence the wrapper: the <img> paints the logo, the ::after paints the
          light passing over it. */}
      <div className="splash-logo">
        <img
          src={wordmarkLight}
          alt={product.name}
          className="splash-logo__img h-24 w-auto select-none"
          draggable={false}
        />
      </div>
      <div className="splash-tagline text-sm text-ink-inverse/70">{product.tagline}</div>
      <div className="splash-tagline text-[11px] uppercase tracking-[0.18em] text-ink-inverse/40">
        by {product.vendor}
      </div>
    </div>
  );
}
