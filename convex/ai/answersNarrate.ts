"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { checkAndRecordAiRateLimit } from "./rateLimit";
import { captureConvexError } from "../observability/sentry";

function buildNarratePrompt(input: {
  questionPrompt: string;
  answerText: string;
  chapterTitle: string;
}): string {
  return [
    "You are an expert memoir ghostwriter helping someone preserve their personal memories.",
    "Your task: rephrase the answer below into warm, readable prose for a memoir chapter.",
    "",
    "STRICT RULES:",
    "- Do NOT invent names, places, dates, or facts not present in the original answer.",
    "- Do NOT add information, assumptions, or elaborations.",
    "- Only rephrase — improve clarity, flow, and warmth while keeping the original meaning intact.",
    "- Output ONLY the rephrased text. No preamble, no quotes, no labels.",
    "- Keep it to 1–3 sentences. Do not pad unnecessarily.",
    "",
    `Chapter: ${input.chapterTitle}`,
    `Question: ${input.questionPrompt}`,
    "",
    "Original answer (rephrase this):",
    input.answerText
  ].join("\n");
}

export const narrate = action({
  args: {
    viewerSubject: v.optional(v.string()),
    questionPrompt: v.string(),
    answerText: v.string(),
    chapterTitle: v.string()
  },
  handler: async (ctx, args): Promise<{ ok: true; narratedText: string } | { ok: false; errorCode: string; message: string }> => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      const subject = identity?.subject || identity?.tokenIdentifier || args.viewerSubject || null;
      if (!subject) return { ok: false, errorCode: "UNAUTHORIZED", message: "Unauthorized" };

      const rateLimit = checkAndRecordAiRateLimit(subject, 10);
      if (!rateLimit.allowed) {
        return { ok: false, errorCode: "RATE_LIMITED", message: "Too many AI requests. Please wait a moment." };
      }

      const answerText = args.answerText.trim();
      if (answerText.length === 0) {
        return { ok: false, errorCode: "EMPTY_ANSWER", message: "No answer text to narrate." };
      }

      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) throw new Error("Missing GROQ_API_KEY environment variable");

      const prompt = buildNarratePrompt({
        questionPrompt: args.questionPrompt,
        answerText,
        chapterTitle: args.chapterTitle
      });

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0.5,
          max_tokens: 400
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Groq API error: ${response.status} ${text}`);
      }

      const data = await response.json() as { choices: Array<{ message: { content: string } }> };
      const narratedText = data.choices[0]?.message?.content?.trim() ?? "";

      if (!narratedText) {
        return { ok: false, errorCode: "EMPTY_RESPONSE", message: "AI returned an empty response. Please try again." };
      }

      return { ok: true, narratedText };
    } catch (error) {
      captureConvexError(error, {
        flow: "answers_narrate",
        code: "NARRATE_FAILED"
      });
      return {
        ok: false,
        errorCode: "NARRATE_FAILED",
        message: error instanceof Error ? error.message : "AI narrate failed. Please try again."
      };
    }
  }
});
