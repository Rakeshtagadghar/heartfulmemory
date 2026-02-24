export type TypographyTokenName = "h1" | "h2" | "body" | "caption";

export type TypographyToken = {
  fontFamily: "MemoriosoSans" | "MemoriosoSerif";
  fontSizePx: number;
  lineHeight: number;
  fontWeight: number;
  letterSpacingPx?: number;
};

export const typographyTokens: Record<TypographyTokenName, TypographyToken> = {
  h1: { fontFamily: "MemoriosoSans", fontSizePx: 42, lineHeight: 1.08, fontWeight: 700, letterSpacingPx: -0.8 },
  h2: { fontFamily: "MemoriosoSans", fontSizePx: 28, lineHeight: 1.14, fontWeight: 700, letterSpacingPx: -0.3 },
  body: { fontFamily: "MemoriosoSerif", fontSizePx: 15, lineHeight: 1.45, fontWeight: 400 },
  caption: { fontFamily: "MemoriosoSans", fontSizePx: 11, lineHeight: 1.3, fontWeight: 500 }
};

export function fontFaceCss() {
  // v1 uses robust system-stack fallbacks while keeping named faces stable for the renderer contract.
  return `
@font-face {
  font-family: 'MemoriosoSans';
  src: local('Arial');
  font-weight: 400 700;
}
@font-face {
  font-family: 'MemoriosoSerif';
  src: local('Georgia');
  font-weight: 400 700;
}
`;
}

