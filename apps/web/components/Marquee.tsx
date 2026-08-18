// An infinite marquee of capability pills, matching the reference's scrolling
// band. The row is duplicated so the -50% loop is seamless; it pauses on hover.
// The edges fade out via a mask so pills enter and leave softly.
export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div
      className="marquee overflow-hidden"
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
      }}
    >
      <div className="flex w-max animate-scroll gap-3">
        {row.map((label, i) => (
          <span
            key={i}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm text-ink-secondary shadow-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
