export function buildUpdatedShapeStyle(
  current: Record<string, unknown> | null | undefined,
  patch: Record<string, unknown>
) {
  return {
    ...(current ?? {}),
    ...patch
  };
}

