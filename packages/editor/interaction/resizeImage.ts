export type ResizeHandle = "n" | "e" | "s" | "w" | "nw" | "ne" | "se" | "sw";

export type Rect = { x: number; y: number; w: number; h: number };

type ResizeImageInput = {
  start: Rect;
  dx: number;
  dy: number;
  handle: ResizeHandle;
  minSize?: number;
};

export function resizeImageWithAspect(input: ResizeImageInput): Rect {
  const minSize = Math.max(16, input.minSize ?? 24);
  const start = input.start;
  const ratio = Math.max(0.01, start.w / Math.max(1, start.h));
  const centerX = start.x + start.w / 2;
  const centerY = start.y + start.h / 2;

  const widthFromHeight = (height: number) => Math.max(minSize, Math.round(height * ratio));
  const heightFromWidth = (width: number) => Math.max(minSize, Math.round(width / ratio));

  let w = start.w;
  let h = start.h;
  let x = start.x;
  let y = start.y;

  if (input.handle === "e" || input.handle === "w") {
    const rawW = input.handle === "e" ? start.w + input.dx : start.w - input.dx;
    w = Math.max(minSize, rawW);
    h = heightFromWidth(w);
    x = input.handle === "w" ? start.x + (start.w - w) : start.x;
    y = Math.round(centerY - h / 2);
    return { x, y, w, h };
  }

  if (input.handle === "n" || input.handle === "s") {
    const rawH = input.handle === "s" ? start.h + input.dy : start.h - input.dy;
    h = Math.max(minSize, rawH);
    w = widthFromHeight(h);
    y = input.handle === "n" ? start.y + (start.h - h) : start.y;
    x = Math.round(centerX - w / 2);
    return { x, y, w, h };
  }

  const widthRatio = (start.w + (input.handle.includes("w") ? -input.dx : input.dx)) / Math.max(1, start.w);
  const heightRatio = (start.h + (input.handle.includes("n") ? -input.dy : input.dy)) / Math.max(1, start.h);
  const chosenRatio =
    Math.abs(widthRatio - 1) >= Math.abs(heightRatio - 1) ? widthRatio : heightRatio;
  const nextW = Math.max(minSize, Math.round(start.w * chosenRatio));
  const nextH = heightFromWidth(nextW);

  w = nextW;
  h = nextH;
  x = input.handle.includes("w") ? start.x + (start.w - w) : start.x;
  y = input.handle.includes("n") ? start.y + (start.h - h) : start.y;

  return { x, y, w, h };
}
