import type { ExportTarget, PdfRenderContract } from "../../pdf-renderer/src/contracts";

export const PDF_RENDER_CONTRACT_VERSION = 1 as const;

export type RenderableNodeType = "text" | "image" | "shape" | "line" | "frame" | "group";

export type RenderableNodeBaseV1 = {
  id: string;
  type: RenderableNodeType;
  pageId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  opacity?: number;
  locked?: boolean;
  style?: Record<string, unknown>;
  content?: Record<string, unknown>;
  crop?: Record<string, unknown> | null;
  childrenIds?: string[];
};

export type RenderableNodeV1 = RenderableNodeBaseV1;

export type RenderablePageV1 = {
  id: string;
  orderIndex: number;
  sizePreset: "A4" | "US_LETTER" | "BOOK_6X9" | "BOOK_8_5X11";
  widthPx: number;
  heightPx: number;
  margins: { top: number; right: number; bottom: number; left: number; unit: "px" };
  background: { fill: string };
  drawOrder: string[];
};

export type RenderableAssetV1 = {
  id: string;
  source?: string | null;
  sourceUrl?: string | null;
  storageProvider?: string | null;
  storageKey?: string | null;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
  license?: Record<string, unknown> | null;
};

export type RenderableDocumentV1 = {
  renderVersion: typeof PDF_RENDER_CONTRACT_VERSION;
  exportTarget: ExportTarget;
  storybook: {
    id: string;
    title: string;
    subtitle: string | null;
    updatedAt: string;
    settings: Record<string, unknown>;
  };
  pages: RenderablePageV1[];
  nodes: RenderableNodeV1[];
  assets: RenderableAssetV1[];
};

export function toRenderableContractV1FromLegacy(contract: PdfRenderContract): RenderableDocumentV1 {
  const nodes: RenderableNodeV1[] = contract.frames.map((frame) => ({
    id: frame.id,
    type:
      frame.type === "TEXT"
        ? "text"
        : frame.type === "IMAGE"
          ? "image"
          : frame.type === "SHAPE"
            ? "shape"
            : frame.type === "LINE"
              ? "line"
              : frame.type === "FRAME"
                ? "frame"
                : "group",
    pageId: frame.pageId,
    x: frame.x,
    y: frame.y,
    w: frame.w,
    h: frame.h,
    opacity: typeof frame.style?.opacity === "number" ? (frame.style.opacity as number) : 1,
    locked: frame.locked,
    style: frame.style,
    content: frame.content,
    crop: frame.crop,
    childrenIds:
      frame.type === "GROUP" && Array.isArray((frame.content as { childrenIds?: unknown }).childrenIds)
        ? ((frame.content as { childrenIds?: unknown }).childrenIds as unknown[])
            .filter((value): value is string => typeof value === "string" && value.length > 0)
        : undefined
  }));

  const pageDrawOrder = new Map<string, string[]>();
  for (const page of contract.pages) {
    pageDrawOrder.set(
      page.id,
      contract.frames
        .filter((frame) => frame.pageId === page.id)
        .slice()
        .sort((a, b) => a.zIndex - b.zIndex || a.id.localeCompare(b.id))
        .map((frame) => frame.id)
    );
  }

  return {
    renderVersion: PDF_RENDER_CONTRACT_VERSION,
    exportTarget: contract.exportTarget,
    storybook: contract.storybook,
    pages: contract.pages.map((page) => ({
      id: page.id,
      orderIndex: page.orderIndex,
      sizePreset: page.sizePreset,
      widthPx: page.widthPx,
      heightPx: page.heightPx,
      margins: page.margins,
      background: page.background,
      drawOrder: pageDrawOrder.get(page.id) ?? []
    })),
    nodes,
    assets: contract.assets
  };
}
