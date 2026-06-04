/**
 * Kari "Pin-K" brand mark — location pin with a K in negative space. Single-path
 * SVG that inherits `currentColor`; recolor via text color (yellow/white on dark,
 * navy on light — never yellow on light). Source: brand/mark/kari-mark.svg.
 */
export function KariMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label="Kari"
      className={className}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M50 94 C33 71 21 60 21 41 a29 29 0 1 1 58 0 C79 60 67 71 50 94 Z M37 27 L46 27 L46 39 L55 27 L64 27 L51 42 L64 57 L55 57 L46 45 L46 57 L37 57 Z"
      />
    </svg>
  );
}
