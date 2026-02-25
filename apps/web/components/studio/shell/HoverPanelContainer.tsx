"use client";

import type { ReactNode } from "react";
import { Button } from "../../ui/button";
import { cn } from "../../ui/cn";
import type { StudioShellPanelId } from "./miniSidebarConfig";
import { STUDIO_SHELL_V2_SPEC } from "./spec";

export function HoverPanelContainer({
  open,
  panelId,
  title,
  description,
  pinned,
  onClose,
  onPinToggle,
  onMouseEnter,
  onMouseLeave,
  children
}: {
  open: boolean;
  panelId: StudioShellPanelId | null;
  title?: string;
  description?: string;
  pinned: boolean;
  onClose: () => void;
  onPinToggle: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "pointer-events-auto absolute bottom-2 top-2 transition duration-150 ease-out",
        open ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-2 opacity-0"
      )}
      style={{
        left: STUDIO_SHELL_V2_SPEC.miniSidebarWidthPx + STUDIO_SHELL_V2_SPEC.panelGapPx,
        width: STUDIO_SHELL_V2_SPEC.panelWidthPx,
        zIndex: STUDIO_SHELL_V2_SPEC.zIndex.panel
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role={pinned ? "dialog" : "region"}
      aria-modal={pinned || undefined}
      aria-labelledby={panelId ? `studio-shell-panel-title-${panelId}` : undefined}
      id={panelId ? `studio-shell-panel-${panelId}` : undefined}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#0c1422]/95 shadow-[0_18px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="border-b border-white/10 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                id={panelId ? `studio-shell-panel-title-${panelId}` : undefined}
                className="text-sm font-semibold text-white"
              >
                {title ?? "Panel"}
              </p>
              {description ? (
                <p className="mt-1 text-xs leading-4 text-white/55">{description}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant={pinned ? "secondary" : "ghost"}
                aria-pressed={pinned}
                onClick={onPinToggle}
              >
                {pinned ? "Unpin" : "Pin"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </div>
    </div>
  );
}
