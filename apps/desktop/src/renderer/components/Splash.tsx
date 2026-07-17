import { product } from '@bullebrowser/brand-tokens';
import wordmarkLight from '@bullebrowser/brand-tokens/wordmark-light.png';

export function Splash() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-surface-dark px-12 text-ink-inverse">
      <img
        src={wordmarkLight}
        alt={product.name}
        className="h-10 w-auto select-none"
        draggable={false}
      />
      <div className="text-sm text-ink-inverse/70">{product.tagline}</div>
      <div className="text-[11px] uppercase tracking-[0.18em] text-ink-inverse/40">
        by {product.vendor}
      </div>
    </div>
  );
}
