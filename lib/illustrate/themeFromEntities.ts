import type { ChapterDraftEntitiesV2 } from "../../packages/shared/entities/entitiesTypes";

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeToken(value: string) {
  return value.toLowerCase().replaceAll(/[^a-z0-9\s-]/g, " ").replaceAll(/\s+/g, " ").trim();
}

function chapterStyleFromKey(chapterKey: string) {
  const key = chapterKey.toLowerCase();
  if (key.includes("origin")) return { style: "ancestral home landscape", negative: ["studio portrait"] };
  if (key.includes("school")) return { style: "school campus classroom vintage", negative: ["close portrait"] };
  if (key.includes("home")) return { style: "family home interior neighborhood", negative: ["formal portrait"] };
  return { style: "family memory documentary", negative: ["posed studio"] };
}

export function buildThemeFromEntities(input: {
  chapterKey: string;
  entities?: { places?: string[] } | null;
  entitiesV2?: ChapterDraftEntitiesV2 | null;
  includePersonalNames?: boolean;
}) {
  const style = chapterStyleFromKey(input.chapterKey);
  const places = unique(
    (input.entitiesV2?.places.map((p) => p.value) ?? input.entities?.places ?? [])
      .map((value) => normalizeToken(value))
      .filter(Boolean)
  ).slice(0, 3);

  const peopleTerms = input.includePersonalNames
    ? unique((input.entitiesV2?.people.map((p) => normalizeToken(p.value)) ?? []).filter(Boolean)).slice(0, 2)
    : [];

  const keywords = unique([...places, ...peopleTerms, ...style.style.split(/\s+/)]).filter((v) => v.length >= 3);
  const negativeKeywords = unique([
    "portrait",
    "watermark",
    "logo",
    "blurry",
    "low resolution",
    "text overlay",
    ...style.negative
  ]);

  return {
    placeKeywords: places,
    keywords,
    negativeKeywords
  };
}
