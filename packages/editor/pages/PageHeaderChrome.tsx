"use client";

import { useEffect, useState } from "react";
import { PageControls } from "./PageControls";

export function PageHeaderChrome({
  pageNumber,
  pageCount,
  title,
  isHidden,
  isLocked,
  onTitleCommit,
  onMoveUp,
  onMoveDown,
  onToggleHidden,
  onToggleLocked,
  onDelete,
  onAddPageAfter
}: {
  pageNumber: number;
  pageCount: number;
  title: string;
  isHidden: boolean;
  isLocked: boolean;
  onTitleCommit: (title: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleHidden: () => void;
  onToggleLocked: () => void;
  onDelete: () => void;
  onAddPageAfter: () => void;
}) {
  const [draftTitle, setDraftTitle] = useState(title);

  useEffect(() => {
    setDraftTitle(title);
  }, [title]);

  return (
    <div
      data-page-chrome="true"
      className="print:hidden flex items-center justify-between gap-4 bg-[#c7c8cd] px-1 py-2"
    >
      <label className="min-w-0 flex-1 text-left text-[28px]">
        <span className="text-sm font-semibold text-[#0f1726]">Page {pageNumber}</span>
        <span className="mx-1 text-sm text-[#606572]">-</span>
        <input
          type="text"
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          onBlur={() => onTitleCommit(draftTitle)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setDraftTitle(title);
              event.currentTarget.blur();
            }
          }}
          placeholder="Add page title"
          className="w-[220px] max-w-full border-0 bg-transparent text-sm text-[#606572] outline-none placeholder:text-[#7a808d]"
          aria-label={`Page ${pageNumber} title`}
        />
      </label>

      <PageControls
        canMoveUp={pageNumber > 1}
        canMoveDown={pageNumber < pageCount}
        isHidden={isHidden}
        isLocked={isLocked}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onToggleHidden={onToggleHidden}
        onToggleLocked={onToggleLocked}
        onDelete={onDelete}
        onAddPageAfter={onAddPageAfter}
      />
    </div>
  );
}
