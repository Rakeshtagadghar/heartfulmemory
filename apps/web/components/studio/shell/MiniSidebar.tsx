"use client";

import { useId, useRef, useState } from "react";
import {
  trackMiniSidebarIconClick,
  trackMiniSidebarIconHover
} from "../../../lib/analytics/studio";
import { cn } from "../../ui/cn";
import { focusMiniSidebarSibling, getPointerInputType } from "./a11y";
import type { MiniSidebarItem, StudioShellPanelId } from "./miniSidebarConfig";
import { MINI_SIDEBAR_WIDTH_PX } from "./miniSidebarConfig";
import type { StudioShellInputType } from "./useHoverPanelController";

type TooltipState = {
  panelId: StudioShellPanelId | null;
};

function MiniSidebarGlyph({ panelId }: { panelId: StudioShellPanelId }) {
  const common = {
    className: "h-4 w-4",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true
  };

  switch (panelId) {
    case "layouts":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M10 5v14" />
          <path d="M4 11h6" />
        </svg>
      );
    case "text":
      return (
        <svg {...common}>
          <path d="M5 7h14" />
          <path d="M12 7v10" />
          <path d="M8.5 17h7" />
        </svg>
      );
    case "elements":
      return (
        <svg {...common}>
          <circle cx="7.5" cy="8" r="2.5" />
          <rect x="12" y="5.5" width="6.5" height="5" rx="1" />
          <path d="M6 18l3.5-5 3.5 5z" />
          <path d="M14 18h5" />
        </svg>
      );
    case "uploads":
      return (
        <svg {...common}>
          <path d="M12 15V6" />
          <path d="m8.5 9.5 3.5-3.5 3.5 3.5" />
          <path d="M5 18h14" />
          <path d="M7 18v1h10v-1" />
        </svg>
      );
    case "tools":
      return (
        <svg {...common}>
          <path d="M5 7h8" />
          <path d="M17 7h2" />
          <circle cx="15" cy="7" r="2" />
          <path d="M5 12h2" />
          <path d="M11 12h8" />
          <circle cx="9" cy="12" r="2" />
          <path d="M5 17h10" />
          <path d="M19 17h0" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      );
    case "photos":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="m7 16 3.5-3.5L13 15l2.5-2.5L18 16" />
        </svg>
      );
    default:
      return null;
  }
}

export function MiniSidebar({
  hoverCapable,
  openPanelId,
  pinnedPanelId,
  onIconHoverStart,
  onIconHoverEnd,
  onIconActivate,
  items,
  disabledPanelIds
}: {
  hoverCapable: boolean;
  openPanelId: StudioShellPanelId | null;
  pinnedPanelId: StudioShellPanelId | null;
  onIconHoverStart: (panelId: StudioShellPanelId) => void;
  onIconHoverEnd: () => void;
  onIconActivate: (panelId: StudioShellPanelId, inputType: StudioShellInputType) => void;
  items: MiniSidebarItem[];
  disabledPanelIds?: StudioShellPanelId[];
}) {
  const [tooltip, setTooltip] = useState<TooltipState>({ panelId: null });
  const railId = useId();
  const lastPointerTypeRef = useRef<PointerEvent["pointerType"] | null>(null);
  const disabled = new Set(disabledPanelIds ?? []);

  return (
    <div
      className="pointer-events-auto flex h-full flex-col items-center border-r border-white/10 bg-[#0b1320]/95 py-3 backdrop-blur"
      style={{ width: MINI_SIDEBAR_WIDTH_PX }}
      role="toolbar"
      aria-orientation="vertical"
      aria-label="Studio panels"
      id={railId}
      onMouseLeave={() => {
        setTooltip({ panelId: null });
        onIconHoverEnd();
      }}
    >
      <div className="flex w-full flex-col items-center gap-2">
        {items.map((item) => {
          const isOpen = openPanelId === item.id;
          const isPinned = pinnedPanelId === item.id;
          const isDisabled = disabled.has(item.id);
          const tooltipVisible = tooltip.panelId === item.id;

          return (
            <div key={item.id} className="relative flex w-full justify-center">
              <button
                type="button"
                data-mini-sidebar-item="true"
                disabled={isDisabled}
                aria-label={item.label}
                aria-pressed={isPinned}
                aria-expanded={isOpen}
                aria-controls={isOpen ? `studio-shell-panel-${item.id}` : undefined}
                className={cn(
                  "flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70",
                  isOpen
                    ? "border-cyan-300/35 bg-cyan-400/12 text-cyan-100"
                    : "border-white/10 bg-white/[0.02] text-white/80 hover:bg-white/[0.06]",
                  isPinned && "shadow-[0_0_0_1px_rgba(34,211,238,0.35)]",
                  isDisabled && "cursor-not-allowed opacity-40"
                )}
                onPointerDown={(event) => {
                  lastPointerTypeRef.current = event.pointerType;
                }}
                onMouseEnter={() => {
                  if (isDisabled) return;
                  setTooltip({ panelId: item.id });
                  trackMiniSidebarIconHover(item.id);
                  if (hoverCapable) {
                    onIconHoverStart(item.id);
                  }
                }}
                onFocus={() => {
                  if (isDisabled) return;
                  setTooltip({ panelId: item.id });
                }}
                onBlur={() => {
                  setTooltip((current) => (current.panelId === item.id ? { panelId: null } : current));
                }}
                onClick={() => {
                  if (isDisabled) return;
                  const inputType = getPointerInputType(
                    lastPointerTypeRef.current ? { pointerType: lastPointerTypeRef.current } : null
                  );
                  trackMiniSidebarIconClick(item.id, inputType, pinnedPanelId === item.id);
                  onIconActivate(item.id, inputType);
                }}
                onKeyDown={(event) => {
                  if (isDisabled) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    trackMiniSidebarIconClick(item.id, "keyboard", pinnedPanelId === item.id);
                    onIconActivate(item.id, "keyboard");
                    return;
                  }
                  if (
                    event.key === "ArrowUp" ||
                    event.key === "ArrowDown" ||
                    event.key === "Home" ||
                    event.key === "End"
                  ) {
                    event.preventDefault();
                    const toolbar =
                      event.currentTarget.closest<HTMLElement>('[role="toolbar"]') ?? event.currentTarget;
                    focusMiniSidebarSibling(toolbar, event.currentTarget, event.key);
                  }
                }}
              >
                <MiniSidebarGlyph panelId={item.id} />
              </button>

              {tooltipVisible ? (
                <div className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-[32] -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#0a111d]/95 px-2 py-1 text-xs text-white shadow-lg backdrop-blur">
                  {item.label}
                  {isPinned ? " (Pinned)" : ""}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
