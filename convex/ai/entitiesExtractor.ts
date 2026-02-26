"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import type { ActionCtx } from "../_generated/server";
import { buildEntitiesExtractorPromptV2 } from "../../lib/ai/prompts/entitiesExtractorPrompt_v2";
import { postprocessEntitiesV2 } from "../../lib/entities/postprocess";
import { normalizeEntityDateValue } from "../../lib/entities/normalizeDates";
import type { ChapterDraftEntitiesV2, ExtractorAnswerInput } from "../../packages/shared/entities/entitiesTypes";

type ExtractErrorCode = "UNAUTHORIZED" | "NO_ANSWERS" | "EXTRACTOR_FAILED";

function clampConfidence(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

async function requireActionUser(ctx: ActionCtx, explicitSubject?: string) {
  const identity = await ctx.auth.getUserIdentity();
  const subject = identity?.subject || identity?.tokenIdentifier || explicitSubject || null;
  if (!subject) throw new Error("Unauthorized");
  return subject;
}

const ROLE_WORDS = [
  "mother",
  "father",
  "mom",
  "dad",
  "grandmother",
  "grandfather",
  "grandma",
  "grandpa",
  "sister",
  "brother",
  "aunt",
  "uncle",
  "cousin",
  "teacher",
  "friend",
  "neighbor"
] as const;

const MONTHS = new Set([
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Sept",
  "Oct",
  "Nov",
  "Dec"
]);
const MONTH_YEAR_REGEX = // NOSONAR
  /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(?:18|19|20)\d{2}\b/g;

function looksLikePlaceCandidate(value: string) {
  if (/(India|Maharashtra|Gujarat|Delhi|Mumbai|Pune|Hyderabad|Bangalore|Chennai)\b/i.test(value)) return true;
  if (/(Village|Town|City|State|District|School|College|Temple|Church|Road|Street)\b/i.test(value)) return true;
  if (value.split(/\s+/).length >= 2) return true;
  return false;
}

function heuristicExtractRaw(args: { answers: ExtractorAnswerInput[] }): ChapterDraftEntitiesV2 { // NOSONAR
  const people = new Map<string, { kind: "person" | "role"; confidence: number; citations: Set<string> }>();
  const places = new Map<string, { confidence: number; citations: Set<string> }>();
  const dates = new Map<string, { normalized: string; confidence: number; citations: Set<string> }>();

  for (const answer of args.answers) {
    const answerText = answer.answerText;
    if (!answerText.trim()) continue;

    for (const role of ROLE_WORDS) {
      const regex = new RegExp(String.raw`\b${role}\b`, "i");
      if (!regex.test(answerText)) continue;
      const value = role.charAt(0).toUpperCase() + role.slice(1);
      const existing = people.get(value) ?? { kind: "role" as const, confidence: 0.88, citations: new Set<string>() };
      existing.citations.add(answer.questionId);
      people.set(value, existing);
    }

    for (const match of answerText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g) ?? []) {
      if (MONTHS.has(match)) continue;
      if (looksLikePlaceCandidate(match)) {
        const place = places.get(match) ?? { confidence: 0.78, citations: new Set<string>() };
        place.citations.add(answer.questionId);
        places.set(match, place);
        continue;
      }
      const person = people.get(match) ?? { kind: "person" as const, confidence: 0.72, citations: new Set<string>() };
      person.citations.add(answer.questionId);
      people.set(match, person);
    }

    for (const match of answerText.match(/\b(?:18|19|20)\d{2}\b/g) ?? []) {
      const existing = dates.get(match) ?? {
        normalized: match,
        confidence: 0.96,
        citations: new Set<string>()
      };
      existing.citations.add(answer.questionId);
      dates.set(match, existing);
    }

    for (const match of answerText.match(MONTH_YEAR_REGEX) ?? []) {
      const normalized = normalizeEntityDateValue(match) ?? match;
      const existing = dates.get(match) ?? {
        normalized,
        confidence: 0.92,
        citations: new Set<string>()
      };
      existing.citations.add(answer.questionId);
      dates.set(match, existing);
    }
  }

  return {
    people: Array.from(people.entries()).map(([value, row]) => ({
      value,
      kind: row.kind,
      confidence: clampConfidence(row.confidence),
      citations: Array.from(row.citations),
      source: "llm" as const
    })),
    places: Array.from(places.entries()).map(([value, row]) => ({
      value,
      confidence: clampConfidence(row.confidence),
      citations: Array.from(row.citations),
      source: "llm" as const
    })),
    dates: Array.from(dates.entries()).map(([value, row]) => ({
      value,
      normalized: row.normalized,
      confidence: clampConfidence(row.confidence),
      citations: Array.from(row.citations),
      source: "llm" as const
    })),
    meta: {
      version: 2,
      generatedAt: Date.now(),
      generator: "llm_extractor_v2"
    }
  };
}

export const extractFromAnswers = action({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters"),
    chapterKey: v.string(),
    chapterTitle: v.optional(v.string()),
    answers: v.array(
      v.object({
        questionId: v.string(),
        questionPrompt: v.string(),
        answerText: v.string()
      })
    )
  },
  handler: async (ctx, args) => {
    try {
      await requireActionUser(ctx, args.viewerSubject);
      const answers = (args.answers as ExtractorAnswerInput[]).filter((row) => row.answerText.trim().length > 0);
      if (answers.length === 0) {
        return {
          ok: false as const,
          errorCode: "NO_ANSWERS" as ExtractErrorCode,
          message: "No answers provided for entity extraction.",
          retryable: false
        };
      }

      // Prompt builder is included now so Sprint 23 can swap heuristic extraction with a provider call without changing the contract.
      void buildEntitiesExtractorPromptV2({
        chapterKey: args.chapterKey,
        chapterTitle: args.chapterTitle ?? args.chapterKey,
        answers
      });

      const rawEntities = heuristicExtractRaw({ answers });
      const postprocessed = postprocessEntitiesV2(rawEntities);

      return {
        ok: true as const,
        provider: "heuristic" as const,
        entities: postprocessed.entities,
        warnings: postprocessed.warnings
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Entity extraction failed";
      const unauthorized = message.toLowerCase().includes("unauthorized");
      return {
        ok: false as const,
        errorCode: (unauthorized ? "UNAUTHORIZED" : "EXTRACTOR_FAILED") as ExtractErrorCode,
        message,
        retryable: !unauthorized
      };
    }
  }
});
