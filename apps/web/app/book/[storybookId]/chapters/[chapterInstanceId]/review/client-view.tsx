"use client";

import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { NarrativeActions } from "../../../../../../components/review/NarrativeActions";
import { ThreeParaEditor, type ThreeParaNarrative } from "../../../../../../components/review/ThreeParaEditor";
import { Card } from "../../../../../../components/ui/card";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { TrackedLink } from "../../../../../../components/tracked-link";
import { OpenInStudioButton } from "../../../../../../components/chapters/OpenInStudioButton";
import type { NarrationSettings } from "../../../../../../../../packages/shared/narrative/narrativeTypes";

interface Props {
    storybookId: string;
    chapterInstanceId: string;
}

export function ReviewClientView({ storybookId, chapterInstanceId }: Props) {
    const router = useRouter();
    const { data: session } = useSession();
    const viewerSubject = session?.user?.id ?? undefined;
    const [isGenerating, setIsGenerating] = useState(false);

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
    const regenParagraph = useAction(api.ai.chapterNarratives.regenParagraph);
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
        } catch (error) {
            console.error(error);
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
        } catch {
            alert("Failed to save changes.");
        }
    };

    const handleRegenParagraph = async (type: "opening" | "story" | "closing") => {
        if (!narrative?._id) {
            await handleGenerate();
            return;
        }
        try {
            await regenParagraph({
                chapterNarrativeId: narrative._id,
                paragraphType: type,
                viewerSubject
            });
            await handleGenerate();
        } catch {
            alert("Regeneration failed. Please try again.");
        }
    };

    const handleApprove = async () => {
        if (!narrative?._id) return;
        try {
            await approve({ chapterNarrativeId: narrative._id });
            // Go to Studio as per T06 requirement (Studio opens after approval)
            router.push(`/studio/${storybookId}?chapter=${chapterInstanceId}`);
        } catch {
            alert("Approval failed.");
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
    const editorNarrative: ThreeParaNarrative | null = narrative
        ? {
              paragraphs: {
                  opening: narrative.paragraphs?.opening ?? "",
                  story: narrative.paragraphs?.story ?? "",
                  closing: narrative.paragraphs?.closing ?? ""
              }
          }
        : null;

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
                hasNarrative={Boolean(editorNarrative)}
                isApproved={isApproved}
                settings={settings}
                onSettingsChange={handleSettingsChange}
                onGenerate={handleGenerate}
                onApprove={handleApprove}
            />

            {(editorNarrative || isGenerating) && (
                <ThreeParaEditor
                    narrative={editorNarrative}
                    isApproved={isApproved}
                    onUpdateText={handleUpdateText}
                    onRegenParagraph={handleRegenParagraph}
                />
            )}
        </div>
    );
}
