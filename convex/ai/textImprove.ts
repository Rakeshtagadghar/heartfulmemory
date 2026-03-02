"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { checkAndRecordAiRateLimit } from "./rateLimit";
import { captureConvexError } from "../observability/sentry";

type ImproveAction =
  | { type: "tone"; tone: string }
  | { type: "fix_grammar" }
  | { type: "extend" }
  | { type: "reduce" }
  | { type: "simplify" }
  | { type: "emojify" }
  | { type: "ask_ai"; prompt: string }
  | { type: "complete" }
  | { type: "summarize" };

function buildPrompt(text: string, action: ImproveAction): string {
  const base = `Output ONLY the improved text with no preamble, labels, or quotes.\n\nText:\n${text}`;
  switch (action.type) {
    case "tone":
      return `Rewrite the following text with a ${action.tone} tone. Keep the same meaning and information.\n\n${base}`;
    case "fix_grammar":
      return `Fix all spelling and grammar errors in the following text. Do not change the meaning, style, or content.\n\n${base}`;
    case "extend":
      return `Extend and elaborate on the following text to make it longer and more detailed while staying on topic.\n\n${base}`;
    case "reduce":
      return `Make the following text shorter and more concise while preserving all key points.\n\n${base}`;
    case "simplify":
      return `Rewrite the following text in simpler, clearer language that is easy to understand.\n\n${base}`;
    case "emojify":
      return `Add relevant emojis to the following text to make it more expressive and engaging. Do not change the words.\n\n${base}`;
    case "ask_ai":
      return `${action.prompt}\n\n${base}`;
    case "complete":
      return `Complete the following text naturally and coherently, continuing from where it left off.\n\n${base}`;
    case "summarize":
      return `Write a concise summary of the following text in 1–3 sentences.\n\n${base}`;
  }
}

export const improve = action({
  args: {
    viewerSubject: v.optional(v.string()),
    text: v.string(),
    action: v.any()
  },
  handler: async (
    ctx,
    args
  ): Promise<{ ok: true; result: string } | { ok: false; errorCode: string; message: string }> => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      const subject = identity?.subject || identity?.tokenIdentifier || args.viewerSubject || null;
      if (!subject) return { ok: false, errorCode: "UNAUTHORIZED", message: "Unauthorized" };

      const rateLimit = checkAndRecordAiRateLimit(subject, 20);
      if (!rateLimit.allowed) {
        return { ok: false, errorCode: "RATE_LIMITED", message: "Too many AI requests. Please wait a moment." };
      }

      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) throw new Error("Missing GROQ_API_KEY environment variable");

      const prompt = buildPrompt(args.text.trim(), args.action as ImproveAction);

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Groq API error: ${response.status} ${text}`);
      }

      const data = await response.json() as { choices: Array<{ message: { content: string } }> };
      const result = data.choices[0]?.message?.content?.trim() ?? "";

      if (!result) {
        return { ok: false, errorCode: "EMPTY_RESPONSE", message: "AI returned an empty response. Please try again." };
      }

      return { ok: true, result };
    } catch (error) {
      captureConvexError(error, { flow: "text_improve", code: "IMPROVE_FAILED" });
      return {
        ok: false,
        errorCode: "IMPROVE_FAILED",
        message: error instanceof Error ? error.message : "AI improve failed. Please try again."
      };
    }
  }
});
