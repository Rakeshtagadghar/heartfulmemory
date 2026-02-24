export const tokens = {
  colors: {
    base: {
      ink: "#0a1321",
      navy: "#0f1e35",
      emerald: "#113b34",
      gold: "#d5b36a",
      parchment: "#f4ecdc",
      rose: "#c66d63"
    },
    text: {
      primary: "text-white",
      muted: "text-white/70",
      subtle: "text-white/55",
      accent: "text-gold"
    },
    border: {
      soft: "border-white/10",
      accent: "border-gold/35"
    },
    surface: {
      glass: "bg-white/[0.04]",
      panel: "bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))]"
    }
  },
  radius: {
    sm: "rounded-lg",
    md: "rounded-xl",
    lg: "rounded-2xl",
    xl: "rounded-3xl"
  },
  shadows: {
    panel: "shadow-panel",
    glow: "shadow-glow"
  },
  spacing: {
    sectionX: "px-6 sm:px-8",
    sectionY: "py-8 lg:py-10",
    container: "mx-auto w-full max-w-7xl"
  },
  typography: {
    display: "font-display text-3xl sm:text-4xl leading-tight text-parchment",
    sectionKicker: "text-xs uppercase tracking-[0.2em] text-gold/90",
    body: "text-sm leading-7 text-white/75"
  }
} as const;

export type DesignTokens = typeof tokens;

