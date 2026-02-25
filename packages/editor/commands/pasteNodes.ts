import type { NodeClipboardPayload } from "../clipboard/nodeClipboard";
import { buildFrameInputFromClipboard, isFramesClipboardPayload } from "../clipboard/nodeClipboard";

type FrameCreateInput = ReturnType<typeof buildFrameInputFromClipboard>;

export function buildFrameInputsFromClipboard(
  payload: NodeClipboardPayload | null | undefined,
  baseOffset = 24
): FrameCreateInput[] {
  if (!payload) return [];
  if (payload.type === "frame") {
    return [buildFrameInputFromClipboard(payload, baseOffset)];
  }
  if (!isFramesClipboardPayload(payload)) return [];

  return payload.items.map((item, index) => buildFrameInputFromClipboard(item, baseOffset + index * 6));
}
