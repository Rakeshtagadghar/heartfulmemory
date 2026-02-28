"use client";

import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

export type ThreeParaNarrative = {
    paragraphs: {
        opening: string;
        story: string;
        closing: string;
    };
};

interface Props {
    narrative: ThreeParaNarrative | null;
    isApproved: boolean;
    onUpdateText: (type: "opening" | "story" | "closing", text: string) => void;
    onRegenParagraph: (type: "opening" | "story" | "closing") => void;
}

export function ThreeParaEditor({ narrative, isApproved, onUpdateText, onRegenParagraph }: Props) {
    const [editing, setEditing] = useState<"opening" | "story" | "closing" | null>(null);
    const [editValue, setEditValue] = useState("");

    const paragraphs = narrative?.paragraphs || { opening: "", story: "", closing: "" };

    const handleEdit = (type: "opening" | "story" | "closing") => {
        setEditing(type);
        setEditValue(paragraphs[type]);
    };

    const handleSave = () => {
        if (editing) {
            onUpdateText(editing, editValue);
            setEditing(null);
        }
    };

    const renderSection = (title: string, type: "opening" | "story" | "closing", text: string) => (
        <Card className="p-6 mb-6">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                <h3 className="text-xl font-bold text-white tracking-wide">{title}</h3>
                {!isApproved && narrative && (
                    <div className="flex gap-2">
                        {editing !== type && (
                            <Button size="sm" variant="secondary" onClick={() => handleEdit(type)}>
                                Edit Text
                            </Button>
                        )}
                        <Button size="sm" variant="secondary" onClick={() => onRegenParagraph(type)}>
                            Regenerate
                        </Button>
                    </div>
                )}
            </div>

            {editing === type ? (
                <div className="flex flex-col gap-3">
                    <textarea
                        className="w-full bg-white/5 border border-white/20 rounded-md p-4 text-white placeholder-white/40 text-lg leading-relaxed min-h-[160px] focus:outline-none focus:ring-2 focus:ring-white/30"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                        <Button size="sm" onClick={handleSave}>Save Changes</Button>
                    </div>
                </div>
            ) : (
                <p className={`text-lg leading-relaxed ${text ? "text-white/90" : "text-white/40 italic"}`}>
                    {text || "Awaiting generation..."}
                </p>
            )}
        </Card>
    );

    return (
        <div className="flex flex-col w-full max-w-4xl mx-auto mt-8">
            {renderSection("Opening", "opening", paragraphs.opening)}
            {renderSection("The Story", "story", paragraphs.story)}
            {renderSection("Closing", "closing", paragraphs.closing)}
        </div>
    );
}
