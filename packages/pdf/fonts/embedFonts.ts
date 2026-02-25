import { pdfFontRegistryV1 } from "./fontRegistry";

export type EmbeddedFontCssResult = {
  css: string;
  warnings: string[];
};

export function buildEmbeddedFontFaceCss(): EmbeddedFontCssResult {
  const warnings: string[] = [];
  const css = pdfFontRegistryV1.faces
    .map((face) => {
      if (!face.filePath) {
        warnings.push(`Font asset for ${face.id} not bundled yet; using local() fallbacks.`);
      }
      const localSrc = face.localNames.map((name) => `local('${name}')`).join(", ");
      const fileSrc = face.filePath ? `, url('${face.filePath}')` : "";
      return `@font-face{font-family:'${face.familyCss}';font-style:${face.style};font-weight:${face.weight};src:${localSrc}${fileSrc};}`;
    })
    .join("\n");
  return { css, warnings };
}

