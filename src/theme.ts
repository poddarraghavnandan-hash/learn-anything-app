/**
 * Shiro visual theme: calm, typographic, generous spacing, light and warm.
 * ONE accent colour (terracotta). Green/red appear only as answer feedback
 * semantics inside the quiz, never as brand colour.
 */
export const theme = {
  colors: {
    bg: '#FFFBF3',
    surface: '#FFFFFF',
    ink: '#2E2A25',
    muted: '#7D7466',
    faint: '#B4A996',
    line: '#F1E7D7',
    accent: '#E4572E',
    accentSoft: '#FDEEE7',
    accentInk: '#B23A17',
    correct: '#2F7D4F',
    correctSoft: '#E7F4EC',
    wrong: '#B3261E',
    wrongSoft: '#FBEAE8',
  },
  radius: {
    card: 18,
    button: 14,
    chip: 999,
  },
  space: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 36,
  },
  font: {
    title: 30,
    heading: 21,
    body: 16,
    small: 13.5,
    tiny: 12,
  },
} as const;
