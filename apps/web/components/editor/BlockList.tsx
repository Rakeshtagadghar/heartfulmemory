"use client";

import { Button } from "../ui/button";
import { Card } from "../ui/card";
import type { BlockDTO } from "../../lib/dto/block";
import { TextBlock } from "./blocks/TextBlock";
import { ImagePlaceholderBlock } from "./blocks/ImagePlaceholderBlock";
import { trackBlockInserted } from "../../lib/analytics/events_creation";

export function BlockList({
  storybookId,
  chapterId,
  chapterTitle,
  blocks,
  draftsByBlockId,
  onDraftChange,
  onInsertTextBlock,
  onInsertImagePlaceholderBlock,
  onUpdateBlock,
  onDeleteBlock,
  onBlockSaved,
  onReloadChapter
}: {
  storybookId: string;
  chapterId: string;
  chapterTitle: string;
  blocks: BlockDTO[];
  draftsByBlockId: Record<string, string>;
  onDraftChange: (blockId: string, html: string) => void;
  onInsertTextBlock: (chapterId: string) => Promise<void>;
  onInsertImagePlaceholderBlock: (chapterId: string) => Promise<void>;
  onUpdateBlock: (input: {
    storybookId: string;
    blockId: string;
    content: Record<string, unknown>;
    expectedVersion?: number;
    overwrite?: boolean;
  }) => Promise<{ ok: true; data: BlockDTO } | { ok: false; error: string; code?: string }>;
  onDeleteBlock: (blockId: string) => Promise<void>;
  onBlockSaved: (block: BlockDTO) => void;
  onReloadChapter: () => Promise<void>;
}) {
  function renderBlockEditor(block: BlockDTO) {
    if (block.type === "TEXT") {
      return (
        <TextBlock
          block={block}
          storybookId={storybookId}
          draftHtml={draftsByBlockId[block.id]}
          onDraftChange={onDraftChange}
          onSaved={onBlockSaved}
          onUpdateBlock={onUpdateBlock}
          onReloadFromServer={onReloadChapter}
        />
      );
    }

    if (block.type === "IMAGE") {
      return (
        <ImagePlaceholderBlock
          block={block}
          storybookId={storybookId}
          onSaved={onBlockSaved}
          onUpdateBlock={onUpdateBlock}
          onReloadFromServer={onReloadChapter}
        />
      );
    }

    return (
      <Card className="p-4">
        <p className="text-sm text-white/70">Block type {block.type} will be supported in a later sprint.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={async () => {
            trackBlockInserted({ chapter_id: chapterId, block_type: "TEXT" });
            await onInsertTextBlock(chapterId);
          }}
        >
          + Text Block
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={async () => {
            trackBlockInserted({ chapter_id: chapterId, block_type: "IMAGE" });
            await onInsertImagePlaceholderBlock(chapterId);
          }}
        >
          + Image Placeholder
        </Button>
      </div>

      {blocks.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-white/70">This chapter is empty. Insert a text block to start writing.</p>
        </Card>
      ) : (
        blocks.map((block) => (
          <div key={block.id} className="space-y-2">
            {renderBlockEditor(block)}

            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`Delete ${block.type.toLowerCase()} block in ${chapterTitle}`}
                onClick={() => onDeleteBlock(block.id)}
              >
                Delete Block
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
