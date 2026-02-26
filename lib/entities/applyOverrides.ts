import type {
  ChapterDraftEntitiesV2,
  ChapterEntityOverrides,
  EntityDateV2,
  EntityPersonV2,
  EntityPlaceV2
} from "../../packages/shared/entities/entitiesTypes";

function normalizeValue(value: string) {
  return value.trim().replaceAll(/\s+/g, " ");
}

function removeSet(overrides: ChapterEntityOverrides | null | undefined) {
  return new Set((overrides?.removes ?? []).map((item) => `${item.kind}:${normalizeValue(item.value).toLowerCase()}`));
}

function dedupePeople(items: EntityPersonV2[]) {
  const seen = new Set<string>();
  const out: EntityPersonV2[] = [];
  for (const item of items) {
    const value = normalizeValue(item.value);
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    out.push({ ...item, value });
  }
  return out;
}

function dedupePlaces(items: EntityPlaceV2[]) {
  const seen = new Set<string>();
  const out: EntityPlaceV2[] = [];
  for (const item of items) {
    const value = normalizeValue(item.value);
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    out.push({ ...item, value });
  }
  return out;
}

function dedupeDates(items: EntityDateV2[]) {
  const seen = new Set<string>();
  const out: EntityDateV2[] = [];
  for (const item of items) {
    const value = normalizeValue(item.value);
    const normalized = normalizeValue(item.normalized || item.value);
    const key = normalized.toLowerCase();
    if (!value || !normalized || seen.has(key)) continue;
    seen.add(key);
    out.push({ ...item, value, normalized });
  }
  return out;
}

export function applyEntityOverrides(
  entities: ChapterDraftEntitiesV2,
  overrides: ChapterEntityOverrides | null | undefined
): ChapterDraftEntitiesV2 {
  if (!overrides) return entities;
  const removes = removeSet(overrides);
  const nextPeople = dedupePeople([
    ...entities.people.filter((item) => !removes.has(`people:${normalizeValue(item.value).toLowerCase()}`)),
    ...(overrides.adds.people ?? [])
  ]);
  const nextPlaces = dedupePlaces([
    ...entities.places.filter((item) => !removes.has(`places:${normalizeValue(item.value).toLowerCase()}`)),
    ...(overrides.adds.places ?? [])
  ]);
  const nextDates = dedupeDates([
    ...entities.dates.filter((item) => !removes.has(`dates:${normalizeValue(item.value).toLowerCase()}`)),
    ...(overrides.adds.dates ?? [])
  ]);
  return {
    ...entities,
    people: nextPeople,
    places: nextPlaces,
    dates: nextDates
  };
}
