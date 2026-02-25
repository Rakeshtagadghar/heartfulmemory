export type PdfFontWeight = 400 | 600 | 700;
export type EditorFontFamily = "Inter" | "Arial" | "Georgia" | "Times New Roman" | (string & {});

export type PdfFontFaceEntry = {
  id: string;
  familyCss: string;
  style: "normal" | "italic";
  weight: PdfFontWeight;
  localNames: string[];
  filePath?: string;
};

export type PdfFontRegistry = {
  familyMap: Record<string, string>;
  faces: PdfFontFaceEntry[];
};

export const pdfFontRegistryV1: PdfFontRegistry = {
  familyMap: {
    Inter: "MemoriosoInter",
    Arial: "MemoriosoSansFallback",
    Georgia: "MemoriosoSerifFallback",
    "Times New Roman": "MemoriosoSerifFallback"
  },
  faces: [
    { id: "inter-400", familyCss: "MemoriosoInter", style: "normal", weight: 400, localNames: ["Inter", "Arial"] },
    { id: "inter-600", familyCss: "MemoriosoInter", style: "normal", weight: 600, localNames: ["Inter SemiBold", "Arial Bold"] },
    { id: "inter-700", familyCss: "MemoriosoInter", style: "normal", weight: 700, localNames: ["Inter Bold", "Arial Bold"] },
    { id: "sans-fallback-400", familyCss: "MemoriosoSansFallback", style: "normal", weight: 400, localNames: ["Arial"] },
    { id: "serif-fallback-400", familyCss: "MemoriosoSerifFallback", style: "normal", weight: 400, localNames: ["Georgia", "Times New Roman"] }
  ]
};

export function mapEditorFontFamilyToPdfFamily(fontFamily: EditorFontFamily | null | undefined) {
  if (!fontFamily) return { familyCss: "MemoriosoInter", warning: "Unknown font family; using Inter fallback." };
  const mapped = pdfFontRegistryV1.familyMap[fontFamily];
  if (!mapped) return { familyCss: "MemoriosoInter", warning: `Unknown font "${fontFamily}"; using Inter fallback.` };
  return { familyCss: mapped };
}

export function normalizePdfFontWeight(input: number | null | undefined): PdfFontWeight {
  if (typeof input !== "number" || !Number.isFinite(input)) return 400;
  if (input >= 700) return 700;
  if (input >= 600) return 600;
  return 400;
}

