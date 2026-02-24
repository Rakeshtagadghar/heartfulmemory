export type SnapInput = {
  x: number;
  y: number;
  w: number;
  h: number;
  pageWidth: number;
  pageHeight: number;
  snapEnabled: boolean;
  gridEnabled: boolean;
  gridColumns: number;
  gridGutter: number;
  margins: { top: number; right: number; bottom: number; left: number };
};

export type SnapResult = {
  x: number;
  y: number;
  w: number;
  h: number;
  outsideSafeArea: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function snapFrame(input: SnapInput): SnapResult {
  const minW = 40;
  const minH = 40;
  let x = clamp(input.x, 0, input.pageWidth - minW);
  let y = clamp(input.y, 0, input.pageHeight - minH);
  let w = clamp(input.w, minW, input.pageWidth - x);
  let h = clamp(input.h, minH, input.pageHeight - y);

  if (input.snapEnabled && input.gridEnabled && input.gridColumns > 0) {
    const contentWidth = input.pageWidth - input.margins.left - input.margins.right;
    const totalGutters = (input.gridColumns - 1) * input.gridGutter;
    const colWidth = Math.max(8, (contentWidth - totalGutters) / input.gridColumns);
    const stepX = Math.max(4, colWidth + input.gridGutter);
    const stepY = 12;
    const snapTo = (value: number, step: number) => Math.round(value / step) * step;
    x = snapTo(x, stepX);
    y = snapTo(y, stepY);
    w = Math.max(minW, snapTo(w, stepX));
    h = Math.max(minH, snapTo(h, stepY));
    x = clamp(x, 0, input.pageWidth - minW);
    y = clamp(y, 0, input.pageHeight - minH);
    w = clamp(w, minW, input.pageWidth - x);
    h = clamp(h, minH, input.pageHeight - y);
  }

  const safeLeft = input.margins.left;
  const safeTop = input.margins.top;
  const safeRight = input.pageWidth - input.margins.right;
  const safeBottom = input.pageHeight - input.margins.bottom;
  const outsideSafeArea = x < safeLeft || y < safeTop || x + w > safeRight || y + h > safeBottom;

  return { x, y, w, h, outsideSafeArea };
}

