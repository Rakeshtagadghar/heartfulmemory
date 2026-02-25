export const STUDIO_SHELL_V2_SPEC = {
  miniSidebarWidthPx: 60,
  panelWidthPx: 320,
  panelGapPx: 8,
  panelInsetPx: 8,
  panelRadiusPx: 16,
  zIndex: {
    shell: 30,
    panel: 31,
    tooltip: 32,
    modal: 50
  },
  hoverIntent: {
    openDelayMs: 150,
    closeDelayMs: 220
  }
} as const;

