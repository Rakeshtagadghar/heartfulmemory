"use client";

import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { NarrativeActions } from "../../../../../../components/review/NarrativeActions";
import { ThreeParaEditor } from "../../../../../../components/review/ThreeParaEditor";
import { Card } from "../../../../../../components/ui/card";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { TrackedLink } from "../../../../../../components/tracked-link";
import { OpenInStudioButton } from "../../../../../../components/chapters/OpenInStudioButton";
import type { NarrationVoice, NarrationTense, NarrationTone, NarrationLength, NarrationSettings } from "../../../../../../../../packages/shared/narrative/narrativeTypes";

interface Props {
    storybookId: string;
    chapterInstanceId: string;
}

export function ReviewClientView({ storybookId, chapterInstanceId }: Props) {
    const router = useRouter();
    const { data: session } = useSession();
    const viewerSubject = session?.user?.id ?? undefined;
    const [isGenerating, setIsGenerating] = useState(false);
    const [isApproving, setIsApproving] = useState(false);

    // Initial default settings
    const [settings, setSettings] = useState<NarrationSettings>({
        voice: "first_person",
        tense: "past",
        tone: "warm",
        length: "medium",
    });

    // Read narrative
    const narrative = useQuery(api.chapterNarratives.getByChapterInstanceId, {
        chapterInstanceId: chapterInstanceId as Id<"storybookChapters">
    });

    // Sync settings from db if existing narrative has them
    useEffect(() => {
        if (narrative?.narration) {
            setSettings(narrative.narration);
        }
    }, [narrative?.narration]);

    // Actions
    const generate = useAction(api.ai.chapterNarratives.generate);
    const updateText = useMutation(api.chapterNarratives.updateText);
    const approve = useMutation(api.chapterNarratives.approve);

    const handleSettingsChange = (key: "voice" | "tense" | "tone" | "length", value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            await generate({
                storybookId: storybookId as Id<"storybooks">,
                chapterInstanceId: chapterInstanceId as Id<"storybookChapters">,
                force: true,
                settings,
                viewerSubject
            });
        } catch (err) {
            console.error(err);
            alert("Generation failed. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUpdateText = async (type: "opening" | "story" | "closing", text: string) => {
        if (!narrative?._id) return;
        try {
            await updateText({
                chapterNarrativeId: narrative._id,
                paragraphType: type,
                text
            });
        } catch (err) {
            alert("Failed to save changes.");
        }
    };

    const handleRegenParagraph = async (type: "opening" | "story" | "closing") => {
        // Basic regen logic can be added here or trigger generic generate for task simplicity
        handleGenerate();
    };

    const handleApprove = async () => {
        if (!narrative?._id) return;
        setIsApproving(true);
        try {
            await approve({ chapterNarrativeId: narrative._id });
            // Go to Studio as per T06 requirement (Studio opens after approval)
            router.push(`/studio/${storybookId}?chapter=${chapterInstanceId}`);
        } catch (err) {
            alert("Approval failed.");
        } finally {
            setIsApproving(false);
        }
    };

    if (narrative === undefined) {
        return (
            <Card className="p-8 flex justify-center items-center">
                <p className="text-white/60">Loading narrative...</p>
            </Card>
        );
    }

    const isApproved = narrative?.approved ?? false;

    return (
        <div className="flex flex-col gap-6 w-full pb-20">
            <div className="mb-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-parchment mb-2">Chapter Narrative</h1>
                    <p className="text-white/60 text-lg">
                        Review the generated 3-paragraph narrative for your chapter before proceeding to the book studio.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <TrackedLink
                        href={`/book/${storybookId}/chapters/${chapterInstanceId}/illustrations`}
                        eventName="illustrations_review_open"
                        className="inline-flex h-10 px-4 items-center justify-center rounded-lg border border-white/15 bg-white/[0.03] text-white/80 transition hover:bg-white/[0.08] hover:text-white"
                        aria-label="Review Illustrations"
                    >
                        Review Illustrations
                    </TrackedLink>
                    <OpenInStudioButton
                        href={`/studio/${storybookId}?chapter=${chapterInstanceId}`}
                        chapterKey="unknown"
                        ariaLabel="Open in Studio"
                    />
                </div>
            </div>

            <NarrativeActions
                isGenerating={isGenerating}
                hasNarrative={!!narrative}
                isApproved={isApproved}
                settings={settings}
                onSettingsChange={handleSettingsChange}
                onGenerate={handleGenerate}
                onApprove={handleApprove}
            />

            {(narrative || isGenerating) && (
                <ThreeParaEditor
                    narrative={narrative as any}
                    isApproved={isApproved}
                    onUpdateText={handleUpdateText}
                    onRegenParagraph={handleRegenParagraph}
                />
            )}
        </div>
    );
}
