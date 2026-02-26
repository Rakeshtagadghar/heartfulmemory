export type PromptLeakHit = {
  phrase: string;
  kind: "denylist" | "regex";
};

const DENYLIST_PHRASES = [
  "write as the storyteller",
  "narration voice:",
  "narration tense:",
  "constraints:",
  "return only",
  "grounding answers",
  "target sections",
  "guidance="
];

const REGEX_RULES = [
  /\b(?:write|return)\s+only\b/i,
  /\bdo not include\b/i,
  /\bsection guidance\b/i,
  /\bopening\.\s*write\b/i
];

export function detectPromptLeakage(text: string): PromptLeakHit[] {
  const hits: PromptLeakHit[] = [];
  const lower = text.toLowerCase();
  for (const phrase of DENYLIST_PHRASES) {
    if (lower.includes(phrase)) hits.push({ phrase, kind: "denylist" });
  }
  for (const regex of REGEX_RULES) {
    const match = text.match(regex);
    if (match?.[0]) hits.push({ phrase: match[0], kind: "regex" });
  }
  return hits;
}

export function startsWithLiteralSectionLabel(text: string) {
  return /^(opening|the story|timeline|reflection)\s*[.:-]/i.test(text.trim());
}

