import type { ChapterDraftRecord } from "../drafts/draftTypes";

export type TextSlotMappingWarning = {
  code: "BODY_TRUNCATED" | "QUOTE_FALLBACK";
  message: string;
  slotId?: string;
};

export type TextSlotMapResult = {
  slotText: Record<string, string>;
  warnings: TextSlotMappingWarning[];
};

function sentenceFragments(input: string) {
  return input
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function truncateWithEllipsis(value: string, maxChars: number) {
  const trimmed = value.trim();
  if (trimmed.length <= maxChars) return { text: trimmed, truncated: false };
  return { text: `${trimmed.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`, truncated: true };
}

function buildPullQuoteFallback(draft: Pick<ChapterDraftRecord, "summary" | "sections">) {
  const summarySentence = sentenceFragments(draft.summary)[0];
  if (summarySentence) return summarySentence;
  const sectionSentence = draft.sections.flatMap((section) => sentenceFragments(section.text))[0];
  if (sectionSentence) return sectionSentence;
  return "A meaningful memory worth preserving.";
}

function normalizeSlotId(slotId: string) {
  return slotId.trim().toLowerCase();
}

function isTitleSlot(slotId: string) {
  const value = normalizeSlotId(slotId);
  return value === "title" || value.endsWith(".title") || value.includes("title");
}

function isBodySlot(slotId: string) {
  const value = normalizeSlotId(slotId);
  return value === "body" || value.includes("body") || value.includes("main") || value.includes("paragraph");
}

function isQuoteSlot(slotId: string) {
  const value = normalizeSlotId(slotId);
  return value.includes("quote") || value.includes("pull");
}

function isCaptionSlot(slotId: string) {
  const value = normalizeSlotId(slotId);
  return value.includes("caption");
}

function buildCaptions(draft: Pick<ChapterDraftRecord, "imageIdeas" | "entities">) {
  const captions: string[] = [];
  for (const idea of draft.imageIdeas) {
    const reason = idea.reason?.trim();
    if (reason) captions.push(reason);
  }
  if (captions.length === 0 && draft.entities.places[0]) {
    captions.push(`Scene inspired by ${draft.entities.places[0]}.`);
  }
  if (captions.length === 0 && draft.entities.dates[0]) {
    captions.push(`Memory from ${draft.entities.dates[0]}.`);
  }
  if (captions.length === 0) captions.push("Chapter memory illustration.");
  return captions;
}

export function mapDraftToTextSlots(input: {
  chapterTitle: string;
  chapterSubtitle?: string | null;
  draft: Pick<ChapterDraftRecord, "summary" | "sections" | "quotes" | "imageIdeas" | "entities">;
  slotIds: string[];
  maxBodyChars?: number;
}): TextSlotMapResult {
  const warnings: TextSlotMappingWarning[] = [];
  const slotText: Record<string, string> = {};
  const captions = buildCaptions(input.draft);

  const fullBody = input.draft.sections
    .map((section) => section.text.trim())
    .filter(Boolean)
    .join("\n\n");
  const bodyResult = truncateWithEllipsis(fullBody || input.draft.summary || "", input.maxBodyChars ?? 1600);
  if (bodyResult.truncated) {
    warnings.push({
      code: "BODY_TRUNCATED",
      message: "Body text was truncated for v1 slot fitting."
    });
  }

  let quoteText = input.draft.quotes[0]?.text?.trim() ?? "";
  if (!quoteText) {
    quoteText = buildPullQuoteFallback(input.draft);
    warnings.push({
      code: "QUOTE_FALLBACK",
      message: "No draft quote available; used a summary/section pull-quote fallback."
    });
  }

  let captionIndex = 0;
  for (const slotId of input.slotIds) {
    if (isTitleSlot(slotId)) {
      slotText[slotId] = input.chapterTitle;
      continue;
    }
    if (normalizeSlotId(slotId).includes("subtitle")) {
      slotText[slotId] = input.chapterSubtitle?.trim() || input.draft.summary;
      continue;
    }
    if (isBodySlot(slotId)) {
      slotText[slotId] = bodyResult.text || input.draft.summary || "";
      continue;
    }
    if (isQuoteSlot(slotId)) {
      slotText[slotId] = quoteText;
      continue;
    }
    if (isCaptionSlot(slotId)) {
      slotText[slotId] = captions[Math.min(captionIndex, captions.length - 1)] ?? "Chapter illustration";
      captionIndex += 1;
      continue;
    }
  }

  return { slotText, warnings };
}

export function mapNarrativeToTextSlots(input: {
  chapterTitle: string;
  chapterSubtitle?: string | null;
  narrative: { paragraphs: { opening: string, story: string, closing: string } };
  slotIds: string[];
  maxBodyChars?: number;
}): TextSlotMapResult {
  const warnings: TextSlotMappingWarning[] = [];
  const slotText: Record<string, string> = {};

  const fullBody = [
    input.narrative.paragraphs.opening,
    input.narrative.paragraphs.story,
    input.narrative.paragraphs.closing
  ]
    .map(p => p.trim())
    .filter(Boolean)
    .join("\n\n");

  const bodyResult = truncateWithEllipsis(fullBody, input.maxBodyChars ?? 1600);
  if (bodyResult.truncated) {
    warnings.push({
      code: "BODY_TRUNCATED",
      message: "Body text was truncated for v1 slot fitting."
    });
  }

  const quoteText = sentenceFragments(input.narrative.paragraphs.opening)[0] || "A meaningful memory worth preserving.";

  for (const slotId of input.slotIds) {
    if (isTitleSlot(slotId)) {
      slotText[slotId] = input.chapterTitle;
      continue;
    }
    if (normalizeSlotId(slotId).includes("subtitle")) {
      slotText[slotId] = input.chapterSubtitle?.trim() || "";
      continue;
    }
    if (isBodySlot(slotId)) {
      slotText[slotId] = bodyResult.text;
      continue;
    }
    if (isQuoteSlot(slotId)) {
      slotText[slotId] = quoteText;
      continue;
    }
    if (isCaptionSlot(slotId)) {
      slotText[slotId] = "Chapter illustration";
      continue;
    }
  }

  return { slotText, warnings };
}
