import {
  defaultTextNodeStyleV1,
  getTextNodePlainText,
  normalizeTextNodeStyleV1
} from "../../nodes/textNode";

export function migrateTextFrameToTextNodeV1(input: {
  content?: Record<string, unknown> | null;
  style?: Record<string, unknown> | null;
}) {
  const content = input.content ?? {};
  const style = normalizeTextNodeStyleV1(input.style);
  return {
    content: {
      kind: "text_frame_v1",
      text: getTextNodePlainText(content)
    },
    style: {
      ...defaultTextNodeStyleV1,
      ...style,
      // Keep backward compatibility for existing renderer/data model that also reads `align`.
      align: style.textAlign
    }
  };
}

