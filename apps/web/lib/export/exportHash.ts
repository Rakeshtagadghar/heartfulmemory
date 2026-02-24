import { createHash } from "node:crypto";
import type { ExportTarget, PdfRenderContract } from "../../../../packages/pdf-renderer/src/contracts";

export function computeExportHash(input: {
  storybookId: string;
  storybookUpdatedAt: string;
  exportTarget: ExportTarget;
  pages: Array<{ id: string; updated_at?: string; updatedAt?: string; order_index?: number; orderIndex?: number }>;
  frames: Array<{ id: string; version?: number; updated_at?: string; updatedAt?: string }>;
}) {
  const normalized = {
    storybookId: input.storybookId,
    storybookUpdatedAt: input.storybookUpdatedAt,
    exportTarget: input.exportTarget,
    pages: input.pages
      .map((page) => ({
        id: page.id,
        updatedAt: page.updated_at ?? page.updatedAt ?? "",
        order: page.order_index ?? page.orderIndex ?? 0
      }))
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)),
    frames: input.frames
      .map((frame) => ({
        id: frame.id,
        version: frame.version ?? 1,
        updatedAt: frame.updated_at ?? frame.updatedAt ?? ""
      }))
      .sort((a, b) => a.id.localeCompare(b.id))
  };

  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex").slice(0, 24);
}

export function computeExportHashFromContract(contract: PdfRenderContract) {
  return computeExportHash({
    storybookId: contract.storybook.id,
    storybookUpdatedAt: contract.storybook.updatedAt,
    exportTarget: contract.exportTarget,
    pages: contract.pages.map((page) => ({
      id: page.id,
      updatedAt: "",
      orderIndex: page.orderIndex
    })),
    frames: contract.frames.map((frame) => ({
      id: frame.id,
      version: frame.version,
      updatedAt: ""
    }))
  });
}

