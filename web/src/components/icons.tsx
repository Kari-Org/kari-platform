import type { ReactNode } from 'react';

export interface IconProps {
  size?: number;
  className?: string;
}

/** Solar-style linear icon base — 24px grid, 1.6 stroke, inherits currentColor (no CDN). */
function Svg({ size = 24, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const ArrowRightUp = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 17 17 7" />
    <path d="M8 7h9v9" />
  </Svg>
);

export const ArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12h15" />
    <path d="M13 5l7 7-7 7" />
  </Svg>
);

export const Wallet = (p: IconProps) => (
  <Svg {...p}>
    <path d="M16 6V5a2 2 0 0 0-2-2H6a3 3 0 0 0-3 3" />
    <rect x="3" y="6" width="18" height="13" rx="3" />
    <path d="M21 11h-4a2 2 0 0 0 0 4h4" />
  </Svg>
);

export const ShieldCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 5 6v5c0 4.4 3 7.4 7 8.9 4-1.5 7-4.5 7-8.9V6l-7-3Z" />
    <path d="M9 11.5l2.2 2.2L15 10" />
  </Svg>
);

export const MedalStar = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="9" r="5.5" />
    <path d="M8.5 13.5 7 21l5-2.4L17 21l-1.5-7.5" />
    <path d="m12 6 1 2 2.2.3-1.6 1.5.4 2.2L12 10.9l-2 1.1.4-2.2L8.8 8.3 11 8l1-2Z" />
  </Svg>
);

export const Routing = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="6" cy="6" r="2" />
    <circle cx="18" cy="18" r="2" />
    <path d="M8 6h7a3 3 0 0 1 3 3v7" />
    <path d="M6 8v5a3 3 0 0 0 3 3h3" />
  </Svg>
);

export const Smartphone = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6" y="2.5" width="12" height="19" rx="3" />
    <path d="M10.5 18.5h3" />
  </Svg>
);

export const CalendarMark = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 9.5h17" />
    <path d="M8 3v4M16 3v4" />
    <path d="M12 14h.01" />
  </Svg>
);

export const Bus = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="13" rx="2.5" />
    <path d="M4 12h16" />
    <path d="M7.5 7.5h9" />
    <path d="M7.5 17v2M16.5 17v2" />
    <path d="M8 14.5h.01M16 14.5h.01" />
  </Svg>
);

export const PlusSquare = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <path d="M12 8.5v7M8.5 12h7" />
  </Svg>
);

export const MinusSquare = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <path d="M8.5 12h7" />
  </Svg>
);
