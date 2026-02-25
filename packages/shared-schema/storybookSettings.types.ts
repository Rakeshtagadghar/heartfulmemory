export type ExportPageSizePreset = "A4" | "US_LETTER" | "BOOK_6X9" | "BOOK_8_5X11";

export type ExportMarginsPx = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  unit: "px";
};

export type ExportTargetsV1 = {
  digitalPdf: boolean;
  hardcopyPdf: boolean;
};

export type PrintPresetV1 = {
  safeAreaPadding: number;
  minImageWidthPx: number;
  imageQuality: "high" | "medium";
  disableLinksStyling: boolean;
};

export type DigitalPresetV1 = {
  imageQuality: "medium" | "high";
  enableLinksStyling: boolean;
  minImageWidthPx: number;
};

export type StorybookExportSettingsV1 = {
  exportTargets: ExportTargetsV1;
  pageSize: ExportPageSizePreset;
  margins: ExportMarginsPx;
  printPreset: PrintPresetV1;
  digitalPreset: DigitalPresetV1;
};

export const defaultStorybookExportSettingsV1: StorybookExportSettingsV1 = {
  exportTargets: {
    digitalPdf: true,
    hardcopyPdf: true
  },
  pageSize: "BOOK_8_5X11",
  margins: {
    top: 44,
    right: 44,
    bottom: 44,
    left: 44,
    unit: "px"
  },
  printPreset: {
    safeAreaPadding: 24,
    minImageWidthPx: 2000,
    imageQuality: "high",
    disableLinksStyling: true
  },
  digitalPreset: {
    imageQuality: "medium",
    enableLinksStyling: false,
    minImageWidthPx: 1200
  }
};

function asFiniteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBool(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function normalizeStorybookExportSettingsV1(
  input: unknown,
  fallbackPageSize?: ExportPageSizePreset,
  fallbackMargins?: Partial<ExportMarginsPx>
): StorybookExportSettingsV1 {
  const root = asRecord(input) ?? {};
  const exportTargets = asRecord(root.exportTargets);
  const printPreset = asRecord(root.printPreset);
  const digitalPreset = asRecord(root.digitalPreset);
  const margins = asRecord(root.margins);

  const pageSize = (() => {
    const value = root.pageSize;
    if (
      value === "A4" ||
      value === "US_LETTER" ||
      value === "BOOK_6X9" ||
      value === "BOOK_8_5X11"
    ) {
      return value;
    }
    return fallbackPageSize ?? defaultStorybookExportSettingsV1.pageSize;
  })();

  return {
    exportTargets: {
      digitalPdf: asBool(exportTargets?.digitalPdf, defaultStorybookExportSettingsV1.exportTargets.digitalPdf),
      hardcopyPdf: asBool(
        exportTargets?.hardcopyPdf ??
          exportTargets?.printPdf,
        defaultStorybookExportSettingsV1.exportTargets.hardcopyPdf
      )
    },
    pageSize,
    margins: {
      top: asFiniteNumber(margins?.top, fallbackMargins?.top ?? defaultStorybookExportSettingsV1.margins.top),
      right: asFiniteNumber(margins?.right, fallbackMargins?.right ?? defaultStorybookExportSettingsV1.margins.right),
      bottom: asFiniteNumber(
        margins?.bottom,
        fallbackMargins?.bottom ?? defaultStorybookExportSettingsV1.margins.bottom
      ),
      left: asFiniteNumber(margins?.left, fallbackMargins?.left ?? defaultStorybookExportSettingsV1.margins.left),
      unit: "px"
    },
    printPreset: {
      safeAreaPadding: asFiniteNumber(
        printPreset?.safeAreaPadding,
        defaultStorybookExportSettingsV1.printPreset.safeAreaPadding
      ),
      minImageWidthPx: asFiniteNumber(
        printPreset?.minImageWidthPx,
        defaultStorybookExportSettingsV1.printPreset.minImageWidthPx
      ),
      imageQuality: printPreset?.imageQuality === "medium" ? "medium" : "high",
      disableLinksStyling: asBool(
        printPreset?.disableLinksStyling,
        defaultStorybookExportSettingsV1.printPreset.disableLinksStyling
      )
    },
    digitalPreset: {
      imageQuality: digitalPreset?.imageQuality === "high" ? "high" : "medium",
      enableLinksStyling: asBool(
        digitalPreset?.enableLinksStyling,
        defaultStorybookExportSettingsV1.digitalPreset.enableLinksStyling
      ),
      minImageWidthPx: asFiniteNumber(
        digitalPreset?.minImageWidthPx,
        defaultStorybookExportSettingsV1.digitalPreset.minImageWidthPx
      )
    }
  };
}
