"use client";

import { track } from "../analytics/client";

type InputType = "mouse" | "touch" | "keyboard";

export function trackStudioPanelOpen(panelId: string, props?: { input_type?: InputType; pinned?: boolean }) {
  track("studio_panel_open", { panel_id: panelId, ...props });
}

export function trackStudioPanelClose(panelId: string, props?: { input_type?: InputType; pinned?: boolean }) {
  track("studio_panel_close", { panel_id: panelId, ...props });
}

export function trackStudioPanelPinToggle(panelId: string, pinned: boolean, inputType: InputType) {
  track("studio_panel_pin_toggle", { panel_id: panelId, pinned, input_type: inputType });
}

export function trackMiniSidebarIconHover(panelId: string) {
  track("mini_sidebar_icon_hover", { panel_id: panelId, input_type: "mouse" });
}

export function trackMiniSidebarIconClick(panelId: string, inputType: InputType, pinned: boolean) {
  track("mini_sidebar_icon_click", { panel_id: panelId, input_type: inputType, pinned });
}
