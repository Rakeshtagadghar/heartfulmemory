type ClipboardFramePayload = {
  type: "frame";
  frameType: "TEXT" | "IMAGE";
  x: number;
  y: number;
  w: number;
  h: number;
  locked: boolean;
  style: Record<string, unknown>;
  content: Record<string, unknown>;
  crop: Record<string, unknown> | null;
};

let nodeClipboard: ClipboardFramePayload | null = null;

export function setNodeClipboard(payload: ClipboardFramePayload) {
  nodeClipboard = payload;
}

export function getNodeClipboard() {
  return nodeClipboard;
}

export function clearNodeClipboard() {
  nodeClipboard = null;
}

export function buildClipboardFramePayload(frame: {
  type: "TEXT" | "IMAGE";
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
