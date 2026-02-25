type ClipboardFramePayload = {
  type: "frame";
  frameType: "TEXT" | "IMAGE" | "SHAPE" | "LINE" | "FRAME" | "GROUP";
  x: number;
  y: number;
  w: number;
  h: number;
  locked: boolean;
  style: Record<string, unknown>;
  content: Record<string, unknown>;
  crop: Record<string, unknown> | null;
};

type ClipboardFramesPayload = {
  type: "frames";
  items: ClipboardFramePayload[];
};

export type NodeClipboardPayload = ClipboardFramePayload | ClipboardFramesPayload;

let nodeClipboard: NodeClipboardPayload | null = null;

export function setNodeClipboard(payload: NodeClipboardPayload) {
  nodeClipboard = payload;
}

export function getNodeClipboard() {
  return nodeClipboard;
}

export function clearNodeClipboard() {
  nodeClipboard = null;
}

export function buildClipboardFramePayload(frame: {
  type: "TEXT" | "IMAGE" | "SHAPE" | "LINE" | "FRAME" | "GROUP";
  x: number;
  y: number;
  w: number;
  h: number;
  locked: boolean;
  style?: Record<string, unknown>;
  content?: Record<string, unknown>;
  crop?: Record<string, unknown> | null;
}): ClipboardFramePayload {
  return {
    type: "frame",
    frameType: frame.type,
    x: frame.x,
    y: frame.y,
    w: frame.w,
    h: frame.h,
    locked: frame.locked,
    style: frame.style ?? {},
    content: frame.content ?? {},
    crop: frame.crop ?? null
  };
}

export function buildClipboardFramesPayload(
  frames: Array<{
    type: "TEXT" | "IMAGE" | "SHAPE" | "LINE" | "FRAME" | "GROUP";
    x: number;
    y: number;
    w: number;
    h: number;
    locked: boolean;
    style?: Record<string, unknown>;
    content?: Record<string, unknown>;
    crop?: Record<string, unknown> | null;
  }>
): ClipboardFramesPayload {
  return {
    type: "frames",
    items: frames.map((frame) => buildClipboardFramePayload(frame))
  };
}

export function buildFrameInputFromClipboard(payload: ClipboardFramePayload, offset = 24) {
  return {
    type: payload.frameType,
    x: payload.x + offset,
    y: payload.y + offset,
    w: payload.w,
    h: payload.h,
    locked: false,
    style: payload.style,
    content: payload.content,
    crop: payload.crop
  };
}

export function isFramesClipboardPayload(
  payload: NodeClipboardPayload | null | undefined
): payload is ClipboardFramesPayload {
  return payload?.type === "frames";
}
