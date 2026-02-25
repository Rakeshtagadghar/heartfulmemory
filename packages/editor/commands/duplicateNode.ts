export function buildDuplicatedFrameInput<T extends {
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  locked?: boolean;
  style?: Record<string, unknown>;
  content?: Record<string, unknown>;
  crop?: Record<string, unknown> | null;
}>(
  frame: T,
  offset = 24
) {
  return {
    type: frame.type as T["type"],
    x: frame.x + offset,
    y: frame.y + offset,
    w: frame.w,
    h: frame.h,
    locked: false,
    style: frame.style ?? {},
    content: frame.content ?? {},
    crop: frame.crop ?? null
  };
}

