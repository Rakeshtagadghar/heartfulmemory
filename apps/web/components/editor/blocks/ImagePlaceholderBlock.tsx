"use client";

import { useMemo, useState } from "react";
import { Card } from "../../ui/card";
import { SaveStatus } from "../SaveStatus";
import { ConflictBanner } from "../ConflictBanner";
import { useAutosave } from "../../../lib/editor/autosave";
import { normalizeImagePlaceholderContent } from "../../../lib/editor/serialize";
import type { BlockDTO } from "../../../lib/dto/block";

export function ImagePlaceholderBlock({
  block,
  storybookId,
  onSaved,
  onUpdateBlock,
  onReloadFromServer
}: {
  block: BlockDTO;
  storybookId: string;
  onSaved: (block: BlockDTO) => void;
  onReloadFromServer: () => Promise<void>;
  onUpdateBlock: (input: {
    storybookId: string;
    blockId: string;
    content: Record<string, unknown>;
    expectedVersion?: number;
    overwrite?: boolean;
  }) => Promise<{ ok: true; data: BlockDTO } | { ok: false; error: string; code?: string }>;
}) {
  const initial = useMemo(() => normalizeImagePlaceholderContent(block.content), [block.content]);
  const [caption, setCaption] = useState(initial.caption);
  const [placementPreset, setPlacementPreset] = useState(initial.placementPreset);
  const [sizePct, setSizePct] = useState(initial.sizePct);
  const [version, setVersion] = useState(block.version);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [overwriteNonce, setOverwriteNonce] = useState(0);

  const currentContent = { kind: "image_placeholder_v0", caption, placementPreset, sizePct } as const;
  const isDirty =
    caption !== initial.caption ||
    placementPreset !== initial.placementPreset ||
    sizePct !== initial.sizePct;

  const autosave = useAutosave({
    payload: { currentContent, version, overwriteNonce },
    isDirty,
    debounceMs: 1000,
    save: ({ currentContent: nextContent, version: expectedVersion, overwriteNonce: nonce }) =>
      onUpdateBlock({
        storybookId,
        blockId: block.id,
        content: nextContent as unknown as Record<string, unknown>,
        expectedVersion,
        overwrite: nonce > 0
      }),
    onSaved: (savedBlock) => {
      setVersion(savedBlock.version);
      setConflictMessage(null);
      onSaved(savedBlock);
    },
    onConflict: (message) => setConflictMessage(message)
  });

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-parchment">Image Placeholder</p>
          <p className="text-xs text-white/55">No uploads yet. Define caption and placement now.</p>
        </div>
        <SaveStatus status={autosave.status} error={autosave.error} />
      </div>

      {conflictMessage ? (
        <div className="mt-3">
          <ConflictBanner
            message={conflictMessage}
            onReload={() => {
              void onReloadFromServer();
              setConflictMessage(null);
            }}
            onOverwrite={() => {
              setConflictMessage(null);
              setOverwriteNonce((value) => value + 1);
              autosave.retryNow();
            }}
          />
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`caption-${block.id}`} className="mb-2 block text-sm text-white/80">
            Caption
          </label>
          <input
            id={`caption-${block.id}`}
            type="text"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            className="h-11 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-sm text-white outline-none focus:border-gold/50"
            placeholder="Describe the image you want here"
          />
        </div>

        <div>
          <label htmlFor={`placement-${block.id}`} className="mb-2 block text-sm text-white/80">
            Placement
          </label>
          <select
            id={`placement-${block.id}`}
            value={placementPreset}
            onChange={(event) =>
              setPlacementPreset(event.target.value as "full" | "left" | "right" | "inline")
            }
            className="h-11 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-sm text-white outline-none focus:border-gold/50"
          >
            <option value="inline">Inline</option>
            <option value="left">Left wrap</option>
            <option value="right">Right wrap</option>
            <option value="full">Full width</option>
          </select>
        </div>

        <div>
          <label htmlFor={`size-${block.id}`} className="mb-2 block text-sm text-white/80">
            Size ({sizePct}%)
          </label>
          <input
            id={`size-${block.id}`}
            type="range"
            min={20}
            max={100}
            step={5}
            value={sizePct}
            onChange={(event) => setSizePct(Number(event.target.value))}
            className="w-full cursor-pointer"
          />
        </div>
      </div>
    </Card>
  );
}
