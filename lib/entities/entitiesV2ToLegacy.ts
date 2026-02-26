import type { ChapterDraftEntities } from "../../packages/shared/drafts/draftTypes";
import type { ChapterDraftEntitiesV2 } from "../../packages/shared/entities/entitiesTypes";

function uniqueValues(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

export function toLegacyDraftEntities(entitiesV2: ChapterDraftEntitiesV2 | null | undefined): ChapterDraftEntities {
  if (!entitiesV2) {
    return { people: [], places: [], dates: [] };
  }
  return {
    people: uniqueValues(entitiesV2.people.map((item) => item.value)).slice(0, 12),
    places: uniqueValues(entitiesV2.places.map((item) => item.value)).slice(0, 12),
    dates: uniqueValues(entitiesV2.dates.map((item) => item.normalized || item.value)).slice(0, 12)
  };
}
