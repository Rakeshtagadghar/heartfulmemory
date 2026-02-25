import { normalizeCropModelV1 } from "../../editor/models/cropModel";
import { normalizeTextNodeStyleV1 } from "../../editor/nodes/textNode";
import { normalizeShapeNodeContentV1, normalizeShapeNodeStyleV1 } from "../../editor/nodes/shapeNode";
import { normalizeLineNodeStyleV1 } from "../../editor/nodes/lineNode";
import { normalizeFrameNodeContentV1, normalizeFrameNodeStyleV1 } from "../../editor/nodes/frameNode";
import { normalizeGridGroupContentV1, normalizeGroupNodeStyleV1 } from "../../editor/nodes/groupNode";
import {
  PDF_RENDER_CONTRACT_VERSION,
  type RenderableDocumentV1,
  type RenderableNodeV1
} from "./renderContractV1";

export type RenderableValidationIssueSeverity = "error" | "warning";

export type RenderableValidationIssue = {
  code:
    | "INVALID_RENDER_VERSION"
    | "PAGE_DUPLICATE_ID"
    | "NODE_DUPLICATE_ID"
    | "NODE_MISSING_PAGE"
    | "DRAW_ORDER_UNKNOWN_NODE"
    | "DRAW_ORDER_MISSING_NODE"
    | "UNSUPPORTED_NODE_TYPE"
    | "MISSING_IMAGE_SOURCE"
    | "MISSING_FRAME_IMAGE_SOURCE"
    | "INVALID_CROP_MODEL"
    | "UNSUPPORTED_TEXT_DECORATION_FALLBACK"
    | "UNKNOWN_FONT_FALLBACK"
    | "INVALID_NODE_BOUNDS";
  severity: RenderableValidationIssueSeverity;
  message: string;
  pageId?: string;
  nodeId?: string;
  path?: string;
};

export type RenderableValidationResult = {
  ok: boolean;
  errors: RenderableValidationIssue[];
  warnings: RenderableValidationIssue[];
  issues: RenderableValidationIssue[];
};

function makeIssue(issue: RenderableValidationIssue): RenderableValidationIssue {
  return issue;
}

function sortIssues(issues: RenderableValidationIssue[]) {
  return issues.slice().sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "error" ? -1 : 1;
    if ((a.pageId ?? "") !== (b.pageId ?? "")) return (a.pageId ?? "").localeCompare(b.pageId ?? "");
    if ((a.nodeId ?? "") !== (b.nodeId ?? "")) return (a.nodeId ?? "").localeCompare(b.nodeId ?? "");
    if (a.code !== b.code) return a.code.localeCompare(b.code);
    return a.message.localeCompare(b.message);
  });
}

function isFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

function validateNodeBounds(node: RenderableNodeV1, issues: RenderableValidationIssue[]) {
  const numeric = [node.x, node.y, node.w, node.h];
  if (!numeric.every(isFiniteNumber) || node.w <= 0 || node.h <= 0) {
    issues.push(
      makeIssue({
        code: "INVALID_NODE_BOUNDS",
        severity: "error",
        message: "Node bounds must be finite numbers with positive width and height.",
        pageId: node.pageId,
        nodeId: node.id,
        path: `nodes.${node.id}.bounds`
      })
    );
  }
}

function validateCrop(node: RenderableNodeV1, issues: RenderableValidationIssue[]) {
  if (!node.crop) return;
  const crop = node.crop as Record<string, unknown>;
  const zoom = crop.zoom ?? crop.scale;
  if (zoom !== undefined && (!isFiniteNumber(zoom) || Number(zoom) <= 0)) {
    issues.push(
      makeIssue({
        code: "INVALID_CROP_MODEL",
        severity: "error",
        message: "Crop zoom/scale must be a positive finite number.",
        pageId: node.pageId,
        nodeId: node.id,
        path: `nodes.${node.id}.crop.zoom`
      })
    );
    return;
  }
  try {
    normalizeCropModelV1(node.crop);
  } catch {
    issues.push(
      makeIssue({
        code: "INVALID_CROP_MODEL",
        severity: "error",
        message: "Crop model is invalid and cannot be normalized.",
        pageId: node.pageId,
        nodeId: node.id,
        path: `nodes.${node.id}.crop`
      })
    );
  }
}

function validateNodeStyleAndContent(node: RenderableNodeV1, doc: RenderableDocumentV1, issues: RenderableValidationIssue[]) {
  const style = node.style ?? {};
  const content = node.content ?? {};
  if (node.type === "text") {
    const rawFontFamily = typeof style.fontFamily === "string" ? style.fontFamily : null;
    const rawTextDecoration = typeof style.textDecoration === "string" ? style.textDecoration : null;
    const normalized = normalizeTextNodeStyleV1(style);
    if (rawTextDecoration && rawTextDecoration !== "none" && rawTextDecoration !== "underline") {
      issues.push(
        makeIssue({
          code: "UNSUPPORTED_TEXT_DECORATION_FALLBACK",
          severity: "warning",
          message: "Unsupported textDecoration was downgraded to a supported fallback.",
          pageId: node.pageId,
          nodeId: node.id,
          path: `nodes.${node.id}.style.textDecoration`
        })
      );
    }
    if (rawFontFamily && !["Inter", "Arial", "Georgia", "Times New Roman"].includes(rawFontFamily)) {
      issues.push(
        makeIssue({
          code: "UNKNOWN_FONT_FALLBACK",
          severity: "warning",
          message: "Unknown font family will fall back to the PDF font registry default.",
          pageId: node.pageId,
          nodeId: node.id,
          path: `nodes.${node.id}.style.fontFamily`
        })
      );
    }
    void normalized;
  } else if (node.type === "image") {
    const assetId = typeof content.assetId === "string" ? content.assetId : null;
    const sourceUrl = typeof content.sourceUrl === "string" ? content.sourceUrl : null;
    const asset = assetId ? doc.assets.find((a) => a.id === assetId) : null;
    if (!assetId && !sourceUrl) {
      issues.push(
        makeIssue({
          code: "MISSING_IMAGE_SOURCE",
          severity: "error",
          message: "Image node is missing both assetId and sourceUrl.",
          pageId: node.pageId,
          nodeId: node.id,
          path: `nodes.${node.id}.content`
        })
      );
    } else if (assetId && !asset?.sourceUrl && !sourceUrl) {
      issues.push(
        makeIssue({
          code: "MISSING_IMAGE_SOURCE",
          severity: "error",
          message: "Image asset is referenced but has no source URL.",
          pageId: node.pageId,
          nodeId: node.id,
          path: `assets.${assetId}.sourceUrl`
        })
      );
    }
  } else if (node.type === "shape") {
    normalizeShapeNodeStyleV1(style);
    normalizeShapeNodeContentV1(content);
  } else if (node.type === "line") {
    normalizeLineNodeStyleV1(style);
  } else if (node.type === "frame") {
    normalizeFrameNodeStyleV1(style);
    const frameContent = normalizeFrameNodeContentV1(content);
    const assetId = frameContent.imageRef?.assetId;
    const sourceUrl = frameContent.imageRef?.sourceUrl ?? frameContent.imageRef?.previewUrl ?? null;
    const asset = assetId ? doc.assets.find((a) => a.id === assetId) : null;
    if (assetId && !asset?.sourceUrl && !sourceUrl) {
      issues.push(
        makeIssue({
          code: "MISSING_FRAME_IMAGE_SOURCE",
          severity: "error",
          message: "Frame imageRef references an asset without a source URL.",
          pageId: node.pageId,
          nodeId: node.id,
          path: `nodes.${node.id}.content.imageRef`
        })
      );
    }
  } else if (node.type === "group") {
    normalizeGroupNodeStyleV1(style);
    normalizeGridGroupContentV1(content);
  } else {
    issues.push(
      makeIssue({
        code: "UNSUPPORTED_NODE_TYPE",
        severity: "error",
        message: `Unsupported node type: ${String((node as { type?: unknown }).type)}`,
        pageId: node.pageId,
        nodeId: node.id,
        path: `nodes.${node.id}.type`
      })
    );
  }

  validateCrop(node, issues);
}

export function validateRenderable(doc: RenderableDocumentV1): RenderableValidationResult {
  const issues: RenderableValidationIssue[] = [];

  if (doc.renderVersion !== PDF_RENDER_CONTRACT_VERSION) {
    issues.push(
      makeIssue({
        code: "INVALID_RENDER_VERSION",
        severity: "error",
        message: `Expected renderVersion ${PDF_RENDER_CONTRACT_VERSION}.`,
        path: "renderVersion"
      })
    );
  }

  const pageIds = new Set<string>();
  for (const page of doc.pages) {
    if (pageIds.has(page.id)) {
      issues.push(
        makeIssue({
          code: "PAGE_DUPLICATE_ID",
          severity: "error",
          message: "Duplicate page id found in renderable document.",
          pageId: page.id,
          path: `pages.${page.id}`
        })
      );
    }
    pageIds.add(page.id);
  }

  const nodesByPage = new Map<string, RenderableNodeV1[]>();
  const nodeIds = new Set<string>();
  for (const node of doc.nodes) {
    if (nodeIds.has(node.id)) {
      issues.push(
        makeIssue({
          code: "NODE_DUPLICATE_ID",
          severity: "error",
          message: "Duplicate node id found in renderable document.",
          pageId: node.pageId,
          nodeId: node.id,
          path: `nodes.${node.id}`
        })
      );
    }
    nodeIds.add(node.id);
    validateNodeBounds(node, issues);
    if (!pageIds.has(node.pageId)) {
      issues.push(
        makeIssue({
          code: "NODE_MISSING_PAGE",
          severity: "error",
          message: "Node references a page that does not exist.",
          pageId: node.pageId,
          nodeId: node.id,
          path: `nodes.${node.id}.pageId`
        })
      );
      continue;
    }
    const pageNodes = nodesByPage.get(node.pageId) ?? [];
    pageNodes.push(node);
    nodesByPage.set(node.pageId, pageNodes);
    validateNodeStyleAndContent(node, doc, issues);
  }

  for (const page of doc.pages) {
    const pageNodeIds = new Set((nodesByPage.get(page.id) ?? []).map((node) => node.id));
    const drawOrderIds = new Set(page.drawOrder);
    for (const nodeId of page.drawOrder) {
      if (!pageNodeIds.has(nodeId)) {
        issues.push(
          makeIssue({
            code: "DRAW_ORDER_UNKNOWN_NODE",
            severity: "error",
            message: "page.drawOrder contains a node id not on this page.",
            pageId: page.id,
            nodeId,
            path: `pages.${page.id}.drawOrder`
          })
        );
      }
    }
    for (const nodeId of pageNodeIds) {
      if (!drawOrderIds.has(nodeId)) {
        issues.push(
          makeIssue({
            code: "DRAW_ORDER_MISSING_NODE",
            severity: "error",
            message: "A page node is missing from page.drawOrder.",
            pageId: page.id,
            nodeId,
            path: `pages.${page.id}.drawOrder`
          })
        );
      }
    }
  }

  const ordered = sortIssues(issues);
  return {
    ok: !ordered.some((issue) => issue.severity === "error"),
    issues: ordered,
    errors: ordered.filter((issue) => issue.severity === "error"),
    warnings: ordered.filter((issue) => issue.severity === "warning")
  };
}
