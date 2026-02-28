import { findRepeatedSentencesAcrossSections } from "./repetition";
import type { NarrativeParagraphs } from "../../../packages/shared/narrative/narrativeTypes";

export interface NarrativeValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export interface NarrativeValidatorConfig {
    minLength: number;
    maxLength: number;
}

const DEFAULT_CONFIG: NarrativeValidatorConfig = {
    minLength: 50,
    maxLength: 1500,
};

const INSTRUCTION_DENYLIST = [
    /here is the/i,
    /certainly/i,
    /i hope this helps/i,
    /as an ai/i,
    /as a language model/i,
    /sure,/i,
    /i can help/i,
    /return only valid json/i,
    /output schema/i,
    // Headings
    /^opening\b/i,
    /^story\b/i,
    /^closing\b/i,
    /^paragraph \d/i,
    /the opening paragraph:/i,
    /the story:/i,
    /the closing paragraph:/i,
];

export function validateNarrative(
    paragraphs: NarrativeParagraphs,
    config: NarrativeValidatorConfig = DEFAULT_CONFIG
): NarrativeValidationResult {
    const result: NarrativeValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
    };

    if (!paragraphs) {
        result.isValid = false;
        result.errors.push("Missing entire paragraphs object.");
        return result;
    }

    const sections = [
        { sectionId: "opening", text: paragraphs.opening || "" },
        { sectionId: "story", text: paragraphs.story || "" },
        { sectionId: "closing", text: paragraphs.closing || "" },
    ];

    // Content checks per paragraph
    for (const { sectionId, text } of sections) {
        if (text.trim().length === 0) {
            result.errors.push(`${sectionId} paragraph cannot be empty.`);
            continue;
        }
        if (text.length < config.minLength) {
            result.errors.push(`${sectionId} paragraph is too short (min ${config.minLength} chars).`);
        }
        if (text.length > config.maxLength) {
            result.errors.push(`${sectionId} paragraph is too long (max ${config.maxLength} chars).`);
        }

        // Checking for instruction leak or headings
        for (const rule of INSTRUCTION_DENYLIST) {
            if (rule.test(text)) {
                result.errors.push(`Paragraph '${sectionId}' contains prohibited instruction/header text.`);
                break; // one is enough per section
            }
        }
    }

    // Repetition check across the 3 paragraphs
    const repeated = findRepeatedSentencesAcrossSections(sections);
    if (repeated.length > 0) {
        result.errors.push(`Found repeated sentences across paragraphs (e.g. repeated in ${repeated[0].sectionIds.join(", ")}).`);
    }

    if (result.errors.length > 0) {
        result.isValid = false;
    }

    return result;
}
