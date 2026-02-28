"use client";

import { Button } from "../ui/button";
import type { NarrationVoice, NarrationTense, NarrationTone, NarrationLength } from "../../../../packages/shared/narrative/narrativeTypes";

interface Props {
    isGenerating: boolean;
    hasNarrative: boolean;
    isApproved: boolean;
    settings: {
        voice: NarrationVoice;
        tense: NarrationTense;
        tone: NarrationTone;
        length: NarrationLength;
    };
    onSettingsChange: (key: "voice" | "tense" | "tone" | "length", value: string) => void;
    onGenerate: () => void;
    onApprove: () => void;
}

export function NarrativeActions({
    isGenerating,
    hasNarrative,
    isApproved,
    settings,
    onSettingsChange,
    onGenerate,
    onApprove
}: Props) {
    return (
        <div className="flex flex-col gap-4 mt-6 p-6 rounded-xl border border-white/10 bg-white/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">Narrative Controls</h3>
                    <p className="text-sm text-white/70">
                        Generate the narrative from your answers, then approve it to proceed.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {!isApproved && (
                        <Button
                            onClick={onGenerate}
                            disabled={isGenerating}
                            variant={hasNarrative ? "secondary" : undefined}
                        >
                            {isGenerating ? "Generating..." : hasNarrative ? "Regenerate All" : "Generate Narrative"}
                        </Button>
                    )}

                    {hasNarrative && !isApproved && (
                        <Button
                            onClick={onApprove}
                            disabled={isGenerating}
                        >
                            Approve Draft
                        </Button>
                    )}

                    {isApproved && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-md font-medium text-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Approved
                        </div>
                    )}
                </div>
            </div>

            {!isApproved && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10 mt-2">
                    <label className="flex flex-col gap-1.5 text-sm text-white/80">
                        <span className="font-medium">Point of View</span>
                        <select
                            className="bg-black/20 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                            value={settings.voice}
                            onChange={(e) => onSettingsChange("voice", e.target.value)}
                            disabled={isGenerating}
                        >
                            <option value="first_person">First Person (&quot;I&quot;)</option>
                            <option value="third_person">Third Person (&quot;They&quot;)</option>
                        </select>
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm text-white/80">
                        <span className="font-medium">Tense</span>
                        <select
                            className="bg-black/20 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                            value={settings.tense}
                            onChange={(e) => onSettingsChange("tense", e.target.value)}
                            disabled={isGenerating}
                        >
                            <option value="past">Past Tense</option>
                            <option value="present">Present Tense</option>
                        </select>
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm text-white/80">
                        <span className="font-medium">Tone</span>
                        <select
                            className="bg-black/20 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                            value={settings.tone}
                            onChange={(e) => onSettingsChange("tone", e.target.value)}
                            disabled={isGenerating}
                        >
                            <option value="warm">Warm & Reflective</option>
                            <option value="playful">Light & Playful</option>
                            <option value="formal">Formal & Structured</option>
                            <option value="poetic">Poetic & Evocative</option>
                        </select>
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm text-white/80">
                        <span className="font-medium">Length</span>
                        <select
                            className="bg-black/20 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                            value={settings.length}
                            onChange={(e) => onSettingsChange("length", e.target.value)}
                            disabled={isGenerating}
                        >
                            <option value="short">Short</option>
                            <option value="medium">Medium</option>
                            <option value="long">Detailed</option>
                        </select>
                    </label>
                </div>
            )}
        </div>
    );
}
