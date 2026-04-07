export const typography = {
  fontFamily: {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
  },
  fontSize: {
    micro: '9px',
    caption: '10px',
    meta: '11px',
    body: '13px',
    h3: '14px',
    h2: '16px',
    h1: '22px',
    display: '36px',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
  },
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.08em',
    widest: '0.15em',
  },
  lineHeight: {
    tight: 1.15,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.65,
  },
} as const;
