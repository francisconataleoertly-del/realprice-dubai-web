"use client";

// Editorial section divider — used between major sections to add visual rhythm.
// Intentionally subtle: a thin gradient line, optional chapter label, optional
// horizontal motion that catches the eye on scroll without dominating.
//
// Three variants:
//   "minimal"   — single hairline gradient, no label
//   "chapter"   — gradient + Roman numeral / chapter label (Dubai-editorial style)
//   "ornament"  — gradient + diamond ornament centred (for major transitions)

type Variant = "minimal" | "chapter" | "ornament";

type Props = {
  variant?: Variant;
  chapter?: string;
  label?: string;
  className?: string;
};

export default function SectionDivider({
  variant = "minimal",
  chapter,
  label,
  className = "",
}: Props) {
  return (
    <div
      role="separator"
      data-print-hide=""
      className={`print:hidden relative mx-auto w-full max-w-7xl px-6 py-12 md:px-10 ${className}`}
    >
      {variant === "chapter" ? (
        <div className="flex items-center gap-5">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/30">
            {chapter ?? "—"}
          </span>
          {label ? (
            <>
              <span className="h-3 w-px bg-white/15" />
              <span className="font-['Fraunces'] text-[12px] font-light italic text-white/45">
                {label}
              </span>
            </>
          ) : null}
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>
      ) : variant === "ornament" ? (
        <div className="flex items-center gap-4">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-white/15" />
          <span
            className="block h-1.5 w-1.5 rotate-45 bg-white/45"
            aria-hidden
          />
          <span
            className="block h-2 w-2 rotate-45 border border-white/45"
            aria-hidden
          />
          <span
            className="block h-1.5 w-1.5 rotate-45 bg-white/45"
            aria-hidden
          />
          <span className="h-px flex-1 bg-gradient-to-r from-white/15 via-white/15 to-transparent" />
        </div>
      ) : (
        <span className="block h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      )}
    </div>
  );
}
