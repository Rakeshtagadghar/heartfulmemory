"use client";

import type { ReactNode, RefObject } from "react";
import { miniSidebarItems, type StudioShellPanelId } from "./miniSidebarConfig";
import { MiniSidebar } from "./MiniSidebar";
import { HoverPanelContainer } from "./HoverPanelContainer";
import { getStudioPanelDefinition } from "./panelRegistry";
import { STUDIO_SHELL_V2_SPEC } from "./spec";
import type { StudioShellInputType } from "./useHoverPanelController";

export type StudioPanelContentMap = Partial<Record<StudioShellPanelId, ReactNode>>;

export function StudioShellV2({
  rootRef,
  hoverCapable,
  openPanelId,
  pinnedPanelId,
  closePanel,
  pinPanel,
  onIconHoverStart,
  onIconHoverEnd,
  onPanelHoverStart,
  onPanelHoverEnd,
  onIconActivate,
  panelContents,
  onCanvasPointerDownCapture,
  children
}: {
  rootRef: RefObject<HTMLDivElement | null>;
  hoverCapable: boolean;
  openPanelId: StudioShellPanelId | null;
  pinnedPanelId: StudioShellPanelId | null;
  closePanel: (inputType?: StudioShellInputType) => void;
  pinPanel: (panelId: StudioShellPanelId, inputType: StudioShellInputType) => void;
  onIconHoverStart: (panelId: StudioShellPanelId) => void;
  onIconHoverEnd: () => void;
  onPanelHoverStart: () => void;
  onPanelHoverEnd: () => void;
  onIconActivate: (panelId: StudioShellPanelId, inputType: StudioShellInputType) => void;
  panelContents: StudioPanelContentMap;
  onCanvasPointerDownCapture?: (target: EventTarget | null) => void;
  children: ReactNode;
}) {
  const activePanelId = openPanelId;
  const activeDefinition = getStudioPanelDefinition(activePanelId);
  const activeContent = activePanelId ? panelContents[activePanelId] ?? null : null;

  return (
    <div
      className="relative min-h-0 flex-1"
      onPointerDownCapture={(event) => onCanvasPointerDownCapture?.(event.target)}
    >
      {children}

      <div
        ref={rootRef}
        className="pointer-events-none absolute inset-y-0 left-0"
        style={{ zIndex: STUDIO_SHELL_V2_SPEC.zIndex.shell }}
      >
        <MiniSidebar
          hoverCapable={hoverCapable}
          openPanelId={openPanelId}
          pinnedPanelId={pinnedPanelId}
          onIconHoverStart={onIconHoverStart}
          onIconHoverEnd={onIconHoverEnd}
          onIconActivate={onIconActivate}
          items={miniSidebarItems}
          disabledPanelIds={miniSidebarItems
            .filter((item) => !panelContents[item.id])
            .map((item) => item.id)}
        />

        <HoverPanelContainer
          open={Boolean(activePanelId && activeContent)}
          panelId={activePanelId}
          title={activeDefinition?.title}
          description={activeDefinition?.description}
          pinned={Boolean(activePanelId && pinnedPanelId === activePanelId)}
          onClose={() => closePanel("mouse")}
          onPinToggle={() => {
            if (!activePanelId) return;
            pinPanel(activePanelId, "mouse");
          }}
          onMouseEnter={onPanelHoverStart}
          onMouseLeave={onPanelHoverEnd}
        >
          {Object.entries(panelContents).map(([panelId, content]) => (
            <div
              key={panelId}
              hidden={panelId !== activePanelId}
              aria-hidden={panelId !== activePanelId}
              className={panelId === activePanelId ? "block" : "hidden"}
            >
              {content}
            </div>
          ))}
        </HoverPanelContainer>
      </div>
    </div>
  );
}
