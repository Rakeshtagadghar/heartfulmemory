import type { StudioShellPanelId } from "./miniSidebarConfig";

export type StudioPanelDefinition = {
  id: StudioShellPanelId;
  title: string;
  description?: string;
};

export const studioPanelRegistry: Record<StudioShellPanelId, StudioPanelDefinition> = {
  layouts: {
    id: "layouts",
    title: "Pages & Layouts",
    description: "Manage pages, order, duplicate, and delete."
  },
  text: {
    id: "text",
    title: "Text",
    description: "Insert text frames and common title/body layouts."
  },
  elements: {
    id: "elements",
    title: "Elements",
    description: "Add common visual building blocks."
  },
  uploads: {
    id: "uploads",
    title: "Uploads",
    description: "Upload your own images."
  },
  tools: {
    id: "tools",
    title: "Tools",
    description: "Contextual tools based on the current selection."
  },
  photos: {
    id: "photos",
    title: "Photos",
    description: "Search and insert stock images."
  }
};

export function getStudioPanelDefinition(panelId: StudioShellPanelId | null) {
  if (!panelId) return null;
  return studioPanelRegistry[panelId] ?? null;
}

