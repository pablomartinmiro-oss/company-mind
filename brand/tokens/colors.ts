// Company Mind — Color Tokens (Payoneer Frosted Glass)
export const colors = {
  pageBg: '#ebe7e0',
  pageBgFrom: '#efebe4',
  pageBgTo: '#e6e2da',

  cardBg: 'rgba(255, 255, 255, 0.55)',
  cardBgFrom: 'rgba(255, 255, 255, 0.7)',
  cardBgTo: 'rgba(255, 255, 255, 0.4)',
  cardBorder: 'rgba(255, 255, 255, 0.6)',
  cardBorderBottom: 'rgba(0, 0, 0, 0.04)',

  sidebarBg: 'rgba(255, 255, 255, 0.4)',
  sidebarBorder: 'rgba(255, 255, 255, 0.5)',
  sidebarItemActive: 'rgba(255, 255, 255, 0.7)',
  sidebarItemHover: 'rgba(255, 255, 255, 0.4)',

  textPrimary: '#1a1a1a',
  textSecondary: '#52525b',
  textTertiary: '#71717a',
  textQuaternary: '#a1a1aa',
  textOnAccent: '#ffffff',

  accent: '#ff6a3d',
  accentLight: '#ff7a4d',
  accentDark: '#ff5a2d',
  accentHover: '#f5552a',
  accentBg: 'rgba(255, 106, 61, 0.1)',
  accentRing: 'rgba(255, 106, 61, 0.3)',
  accentDeep: '#d94a3d',

  success: '#10b981',
  successMuted: 'rgba(16, 185, 129, 0.1)',
  warning: '#f59e0b',
  warningMuted: 'rgba(245, 158, 11, 0.1)',
  danger: '#ef4444',
  dangerMuted: 'rgba(239, 68, 68, 0.1)',
  info: '#3b82f6',
  infoMuted: 'rgba(59, 130, 246, 0.1)',

  gradeA: '#10b981',
  gradeB: '#3b82f6',
  gradeC: '#f59e0b',
  gradeD: '#fb923c',
  gradeF: '#ef4444',
} as const;

export type ColorToken = keyof typeof colors;
