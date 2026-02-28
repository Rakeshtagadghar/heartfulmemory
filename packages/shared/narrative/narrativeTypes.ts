import type { Id } from "../../../convex/_generated/dataModel";

export type ChapterNarrativeStatus = "generating" | "ready" | "error";

export type NarrationVoice = "first_person" | "third_person";
export type NarrationTense = "past" | "present";
export type NarrationTone = "warm" | "formal" | "playful" | "poetic";
export type NarrationLength = "short" | "medium" | "long";

export interface NarrationSettings {
    voice: NarrationVoice;
    tense: NarrationTense;
    tone: NarrationTone;
    length: NarrationLength;
}

export interface NarrativeParagraphs {
    opening: string;
    story: string;
    closing: string;
}

export interface NarrativeCitations {
    opening: string[];
    story: string[];
    closing: string[];
}

export interface ChapterNarrative {
    _id: Id<"chapterNarratives">;
    _creationTime: number;
    storybookId: Id<"storybooks">;
    chapterInstanceId: Id<"storybookChapters">;
    chapterKey: string;
    version: number;
    status: ChapterNarrativeStatus;
    approved: boolean;
    approvedAt?: number | null;
    narration: NarrationSettings;
    paragraphs: NarrativeParagraphs;
    citations: NarrativeCitations;
    answersHash: string;
    warnings?: string[];
    createdAt: number;
    updatedAt: number;
}
