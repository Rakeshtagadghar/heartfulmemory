import type { MediaAttribution } from "../../media/types";

export type CanvasImageNode = {
  id: string;
  type: "image";
  src: string;
  w: number;
  h: number;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  lock: boolean;
  attribution: MediaAttribution | null;
};

export function isCanvasImageNode(value: unknown): value is CanvasImageNode {
  if (!value || typeof value !== "object") return false;
  const node = value as Partial<CanvasImageNode>;
  return (
    node.type === "image" &&
    typeof node.id === "string" &&
    typeof node.src === "string" &&
    typeof node.w === "number" &&
    typeof node.h === "number" &&
    typeof node.x === "number" &&
    typeof node.y === "number"
  );
}
