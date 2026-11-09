/** Ambient background: deep black canvas, two colour blobs, dotted grid, vignette. */
export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950">
      <div className="absolute inset-0 grid-bg opacity-[0.55]" />
      <div className="glow-blob absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-vibe-500/25 sm:h-[560px] sm:w-[560px]" />
      <div className="glow-blob absolute -right-32 top-24 h-[380px] w-[380px] rounded-full bg-aura-500/25 sm:h-[520px] sm:w-[520px]" />
      <div className="glow-blob absolute bottom-0 left-1/3 h-[300px] w-[500px] rounded-full bg-sky-500/10" />
      <div className="absolute inset-0 vignette" />
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
