import type {
  ChapterDraftEntitiesV2,
  EntityDateV2,
  EntityPersonV2,
  EntityPlaceV2,
  EntitiesPostprocessResult,
  ExtractorWarning
} from "../../packages/shared/entities/entitiesTypes";
import { normalizeEntityDateValue } from "./normalizeDates";
import { ENTITY_PERSON_STOPWORDS, RELATIONSHIP_ROLE_WORDS } from "./stopwords";

function collapseWhitespace(value: string) {
  return value.trim().replaceAll(/\s+/g, " ");
}

function clampConfidence(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function lower(value: string) {
  return value.toLowerCase();
}

function pushWarning(
  warnings: ExtractorWarning[],
  code: string,
  message: string,
  entityType?: "people" | "places" | "dates",
  value?: string
) {
  warnings.push({ code, message, entityType, value });
}

function dedupeCitations(citations: string[]) {
  return Array.from(new Set(citations.filter((value) => typeof value === "string" && value.trim().length > 0)));
}

function normalizePeople( // NOSONAR
  input: EntityPersonV2[],
  warnings: ExtractorWarning[]
): EntityPersonV2[] {
  const seen = new Set<string>();
  const result: EntityPersonV2[] = [];

  for (const row of input) {
    const value = collapseWhitespace(row.value);
    if (!value) continue;
    const key = lower(value);
    if (seen.has(key)) continue;

    if (ENTITY_PERSON_STOPWORDS.has(key)) {
      pushWarning(warnings, "PERSON_STOPWORD_REMOVED", `Removed stopword person '${value}'.`, "people", value);
      continue;
    }

    const tokenCount = value.split(/\s+/).filter(Boolean).length;
    const looksRole = row.kind === "role" || RELATIONSHIP_ROLE_WORDS.has(key);
    const looksName = tokenCount >= 2 || (/^[A-Z][a-z]+$/.test(value) && (row.confidence ?? 0) >= 0.75);
    if (!looksRole && value.length < 3) {
      pushWarning(warnings, "PERSON_TOO_SHORT_REMOVED", `Removed short person '${value}'.`, "people", value);
      continue;
    }
    if (!looksRole && !looksName) {
      pushWarning(warnings, "PERSON_INVALID_REMOVED", `Removed weak person entity '${value}'.`, "people", value);
      continue;
    }

    seen.add(key);
    result.push({
      ...row,
      value,
      kind: looksRole ? "role" : "person",
      confidence: clampConfidence(row.confidence),
      citations: dedupeCitations(row.citations)
    });
  }

  return result;
}

function isLikelyPlaceValue(value: string) {
  const tokenCount = value.split(/\s+/).filter(Boolean).length;
  if (tokenCount >= 2) return true;
  if (/^[A-Z][A-Za-z.-]+$/.test(value)) return true;
  return /(india|maharashtra|delhi|mumbai|pune|village|town|city|state|district|school|college)$/i.test(value);
}

function normalizePlaces(
  input: EntityPlaceV2[],
  warnings: ExtractorWarning[]
): EntityPlaceV2[] {
  const seen = new Set<string>();
  const result: EntityPlaceV2[] = [];

  for (const row of input) {
    const value = collapseWhitespace(row.value);
    if (!value) continue;
    const key = lower(value);
    if (seen.has(key)) continue;
    if (!isLikelyPlaceValue(value)) {
      pushWarning(warnings, "PLACE_INVALID_REMOVED", `Removed weak place entity '${value}'.`, "places", value);
      continue;
    }
    seen.add(key);
    result.push({
      ...row,
      value,
      confidence: clampConfidence(row.confidence),
      citations: dedupeCitations(row.citations)
    });
  }

  return result;
}

function normalizeDates(
  input: EntityDateV2[],
  warnings: ExtractorWarning[]
): EntityDateV2[] {
  const seen = new Set<string>();
  const result: EntityDateV2[] = [];

  for (const row of input) {
    const value = collapseWhitespace(row.value);
    if (!value) continue;
    const normalized = normalizeEntityDateValue(row.normalized || value) ?? normalizeEntityDateValue(value);
    if (!normalized) {
      pushWarning(warnings, "DATE_INVALID_REMOVED", `Removed unrecognized date '${value}'.`, "dates", value);
      continue;
    }
    if (seen.has(normalized.toLowerCase())) continue;
    seen.add(normalized.toLowerCase());
    result.push({
      ...row,
      value,
      normalized,
      confidence: clampConfidence(row.confidence),
      citations: dedupeCitations(row.citations)
    });
  }

  return result;
}

export function postprocessEntitiesV2(input: ChapterDraftEntitiesV2): EntitiesPostprocessResult {
  const warnings: ExtractorWarning[] = [];
  return {
    entities: {
      people: normalizePeople(input.people, warnings),
      places: normalizePlaces(input.places, warnings),
      dates: normalizeDates(input.dates, warnings),
      meta: {
        ...input.meta,
        version: 2,
        generator: "llm_extractor_v2"
      }
    },
    warnings
  };
}
