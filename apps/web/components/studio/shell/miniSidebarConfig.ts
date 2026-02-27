import { STUDIO_SHELL_V2_SPEC } from "./spec";

export type StudioShellPanelId =
  | "pages"
  | "layouts"
  | "text"
  | "elements"
  | "uploads"
  | "tools"
  | "photos"
  | "crop";

export type MiniSidebarItem = {
  id: StudioShellPanelId;
  label: string;
  iconText: string;
};

export const MINI_SIDEBAR_WIDTH_PX = STUDIO_SHELL_V2_SPEC.miniSidebarWidthPx;

export const miniSidebarItems: MiniSidebarItem[] = [
  { id: "pages", label: "Pages", iconText: "Pg" },
  { id: "layouts", label: "Layouts", iconText: "Ly" },
  { id: "text", label: "Text", iconText: "T" },
  { id: "elements", label: "Elements", iconText: "El" },
  { id: "uploads", label: "Uploads", iconText: "Up" },
  { id: "tools", label: "Tools", iconText: "Tl" },
  { id: "photos", label: "Photos", iconText: "Ph" }
];
