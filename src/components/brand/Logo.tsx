type LogoProps = {
  className?: string;
  /** "stack" sets BUN over THEORY for square formats (packaging, avatars). */
  layout?: "inline" | "stack";
};

/**
 * The O in THEORY is the mark: a burger cut in cross-section, the same
 * shape the homepage dissects. It works alone as an icon.
 */
export function BurgerGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M2.5 10.2C2.5 5.6 6.8 2.5 12 2.5s9.5 3.1 9.5 7.7c0 .5-.4.8-.9.8H3.4c-.5 0-.9-.3-.9-.8Z" />
      <rect x="1.5" y="12.4" width="21" height="2.4" rx="1.2" fill="var(--color-fire)" />
      <path d="M3 16.4h18v1.8c0 1.8-1.5 3.3-3.3 3.3H6.3C4.5 21.5 3 20 3 18.2v-1.8Z" />
    </svg>
  );
}

export function Logo({ className = "", layout = "inline" }: LogoProps) {
  if (layout === "stack") {
    return (
      <span className={`type-display inline-flex flex-col leading-[0.78] ${className}`} aria-label="Bun Theory">
        <span aria-hidden="true" className="text-[1.62em] tracking-[-0.02em]">BUN</span>
        <span aria-hidden="true" className="inline-flex items-center">
          THE<BurgerGlyph className="mx-[0.02em] h-[0.74em] w-[0.74em]" />RY
        </span>
      </span>
    );
  }

  return (
    <span className={`type-display inline-flex items-center gap-[0.22em] ${className}`} aria-label="Bun Theory">
      <span aria-hidden="true">BUN</span>
      <span aria-hidden="true" className="inline-flex items-center">
        THE<BurgerGlyph className="mx-[0.03em] h-[0.78em] w-[0.78em]" />RY
      </span>
    </span>
  );
}
