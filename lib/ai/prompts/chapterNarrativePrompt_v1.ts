import { NarrationSettings } from "../../../packages/shared/narrative/narrativeTypes";

export type ChapterNarrativePromptV1Input = {
    chapterKey: string;
    chapterTitle: string;
    narration: NarrationSettings;
    answers: Array<{
        questionId: string;
        questionPrompt: string;
        answerText: string;
    }>;
};

const OUTPUT_SCHEMA_HINT_PATH = "docs/chapter_narrative_output_schema_v1.json";

export function buildChapterNarrativePromptV1(input: ChapterNarrativePromptV1Input) {
    const lines: string[] = [
        "You are generating a 3-paragraph memoir chapter.",
        "Return ONLY valid JSON matching the exact schema required.",
        "CRITICAL HARD RULES:",
        "- Return exactly 3 fields for prose: opening, story, closing.",
        "- Each field MUST be exactly ONE paragraph. No bullet lists, no headings (e.g. 'Opening:', 'The Story:'), no extra line breaks.",
        "- Do not include any instructions, meta commentary, or prompt text inside the paragraphs.",
        "- Ensure there is no repetition in wording or facts across the three paragraphs.",
        "- Do not invent names, places, or dates not present in the grounding answers.",
        "- Keep the tone warm and human.",
        "- Maintain zero web knowledge beyond what is provided.",
        "- Do not include any image prompts or ideas in the output.",
        "",
        `Chapter: ${input.chapterTitle} (${input.chapterKey})`,
        `Narration voice: ${input.narration.voice}`,
        `Narration tense: ${input.narration.tense}`,
        `Narration tone: ${input.narration.tone}`,
        `Narration length: ${input.narration.length}`,
        "",
        `Output MUST conform to schema file: ${OUTPUT_SCHEMA_HINT_PATH}`,
        "",
        "Grounding answers (use ONLY these facts):"
    ];

    for (const qa of input.answers) {
        if (!qa.answerText) continue;
        lines.push(`[${qa.questionId}] ${qa.questionPrompt}`);
        lines.push(qa.answerText);
        lines.push("");
    }

    lines.push(
        "JSON format reminder:",
        "- `opening`: string (1 paragraph)",
        "- `story`: string (1 paragraph)",
        "- `closing`: string (1 paragraph)",
        "- `citations`: object with arrays of questionId strings for opening, story, and closing."
    );

    return lines.join("\n");
}
