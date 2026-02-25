import { normalizeTextNodeStyleV1 } from "../nodes/textNode";

export function buildUpdatedTextStyle(
  current: Record<string, unknown> | null | undefined,
  patch: Record<string, unknown>
) {
  const next = normalizeTextNodeStyleV1({ ...(current ?? {}), ...patch });
  return {
    ...next,
    // Backward-compatible alias for current canvas renderer paths.
    align: next.textAlign
  };
}

