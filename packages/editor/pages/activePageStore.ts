export function resolveActivePageId(input: {
  currentActivePageId: string | null;
  availablePageIds: string[];
  preferredPageId?: string | null;
}) {
  const available = new Set(input.availablePageIds);
  if (input.preferredPageId && available.has(input.preferredPageId)) return input.preferredPageId;
  if (input.currentActivePageId && available.has(input.currentActivePageId)) return input.currentActivePageId;
  return input.availablePageIds[0] ?? null;
}
