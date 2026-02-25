"use client";

import { useEffect, useRef, useState } from "react";
import {
  getAlignPageActions,
  getAlignSelectionActions,
  getLayerActions,
  type NodeMenuActionId
} from "./menuActions";

function MenuButton({
  label,
  onClick,
  danger = false,
  disabled = false
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${
        danger ? "text-rose-200 hover:bg-rose-500/10" : "text-white/90 hover:bg-white/[0.06]"
      } disabled:cursor-not-allowed disabled:opacity-40`}
      onClick={onClick}
    >
      <span>{label}</span>
    </button>
  );
}

export function NodeContextMenu({
  open,
  x,
  y,
  onClose,
  onAction,
  locked,
  canPaste,
  canReplaceImage = false,
  isMulti = false,
  canAlignSelection = false,
  canDistribute = false
}: {
  open: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onAction: (action: NodeMenuActionId) => void;
  locked: boolean;
  canPaste: boolean;
  canReplaceImage?: boolean;
  isMulti?: boolean;
  canAlignSelection?: boolean;
  canDistribute?: boolean;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [showAlignPage, setShowAlignPage] = useState(false);
  const [showAlignSelection, setShowAlignSelection] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      onClose();
    }
    globalThis.addEventListener("keydown", onKeyDown);
    globalThis.addEventListener("pointerdown", onPointerDown);
    return () => {
      globalThis.removeEventListener("keydown", onKeyDown);
      globalThis.removeEventListener("pointerdown", onPointerDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  const closeAfter = (action: NodeMenuActionId) => {
    onAction(action);
    setShowAlignPage(false);
    setShowAlignSelection(false);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={isMulti ? "Selection actions" : "Node actions"}
      className="pointer-events-auto absolute z-40 min-w-64 rounded-2xl border border-white/15 bg-[#0c1422]/95 p-2 shadow-2xl backdrop-blur-xl"
      style={{ left: x, top: y }}
    >
      <div className="space-y-1">
        <MenuButton label="Copy" onClick={() => closeAfter("copy")} />
        <MenuButton label="Paste" disabled={!canPaste} onClick={() => closeAfter("paste")} />
        <MenuButton label="Duplicate" onClick={() => closeAfter("duplicate")} />
        {canReplaceImage ? <MenuButton label="Replace image" onClick={() => closeAfter("replaceImage")} /> : null}
        <MenuButton label={locked ? "Unlock" : "Lock"} onClick={() => closeAfter(locked ? "unlock" : "lock")} />
      </div>

      <div className="my-2 h-px bg-white/10" />

      <div className="space-y-1">
        {getLayerActions().map((action) => (
          <MenuButton key={action.id} label={action.label} onClick={() => closeAfter(action.id)} />
        ))}
      </div>

      <div className="my-2 h-px bg-white/10" />

      <div className="space-y-1">
        <MenuButton
          label={showAlignPage ? "Hide Align to page" : "Align to page"}
          onClick={() => setShowAlignPage((current) => !current)}
        />
        {showAlignPage ? (
          <div className="ml-2 space-y-1 rounded-xl border border-white/10 p-2">
            {getAlignPageActions().map((action) => (
              <MenuButton key={action.id} label={action.label} onClick={() => closeAfter(action.id)} />
            ))}
          </div>
        ) : null}

        <MenuButton
          label={showAlignSelection ? "Hide Align to selection" : "Align to selection"}
          disabled={!canAlignSelection}
          onClick={() => setShowAlignSelection((current) => !current)}
        />
        {showAlignSelection ? (
          <div className="ml-2 space-y-1 rounded-xl border border-white/10 p-2">
            {getAlignSelectionActions(!canAlignSelection).map((action) => (
              <MenuButton key={action.id} label={action.label} disabled={action.disabled} onClick={() => closeAfter(action.id)} />
            ))}
          </div>
        ) : null}
        <MenuButton label="Distribute horizontal" disabled={!canDistribute} onClick={() => closeAfter("distributeHorizontal")} />
        <MenuButton label="Distribute vertical" disabled={!canDistribute} onClick={() => closeAfter("distributeVertical")} />
      </div>

      <div className="my-2 h-px bg-white/10" />
      <MenuButton label="Delete" danger onClick={() => closeAfter("delete")} />
    </div>
  );
}
