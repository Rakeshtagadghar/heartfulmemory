/**
 * Resolves the correct layout ID for a given orientation.
 * Falls back to the portrait (base) layout when a landscape variant is not defined.
 */
export function resolveLayoutForOrientation(
  baseLayoutId: string | undefined,
  landscapeLayoutId: string | undefined,
  orientation: "portrait" | "landscape"
): string | undefined {
  if (orientation === "landscape" && landscapeLayoutId) {
    return landscapeLayoutId;
  }
  return baseLayoutId;
}
