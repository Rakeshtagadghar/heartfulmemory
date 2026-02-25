export function supportsHoverUi() {
  if (typeof globalThis.matchMedia !== "function") return true;
  return globalThis.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function getPointerInputType(event: Pick<PointerEvent, "pointerType"> | null | undefined) {
  if (!event?.pointerType) return "mouse" as const;
  if (event.pointerType === "touch") return "touch" as const;
  if (event.pointerType === "pen") return "touch" as const;
  return "mouse" as const;
}

export function focusMiniSidebarSibling(
  container: HTMLElement,
  currentButton: HTMLElement,
  key: "ArrowUp" | "ArrowDown" | "Home" | "End"
) {
  const buttons = Array.from(
    container.querySelectorAll<HTMLButtonElement>('[data-mini-sidebar-item="true"]')
  );
  const currentIndex = buttons.findIndex((button) => button === currentButton);
  if (buttons.length === 0 || currentIndex < 0) return;

  if (key === "Home") {
    buttons[0]?.focus();
    return;
  }
  if (key === "End") {
    buttons.at(-1)?.focus();
    return;
  }

  const delta = key === "ArrowUp" ? -1 : 1;
  const nextIndex = (currentIndex + delta + buttons.length) % buttons.length;
  buttons[nextIndex]?.focus();
}
