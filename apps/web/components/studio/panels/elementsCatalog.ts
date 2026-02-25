export type ElementsCatalogItemId =
  | "rect"
  | "circle"
  | "line"
  | "frame"
  | "grid_2_col"
  | "grid_3_col"
  | "grid_2x2";

export type ElementsCatalogSection = {
  id: string;
  label: string;
  items: Array<{
    id: ElementsCatalogItemId;
    label: string;
    hint: string;
    kind: "shape" | "line" | "frame" | "grid";
  }>;
};

export const elementsQuickChips: Array<{ id: ElementsCatalogItemId; label: string }> = [
  { id: "rect", label: "Rectangle" },
  { id: "line", label: "Line" },
  { id: "frame", label: "Frame" },
  { id: "circle", label: "Circle" },
  { id: "grid_2_col", label: "2-col" },
  { id: "grid_3_col", label: "3-col" },
  { id: "grid_2x2", label: "2x2" }
];

export const elementsCatalogSections: ElementsCatalogSection[] = [
  {
    id: "shapes",
    label: "Shapes",
    items: [
      { id: "rect", label: "Rectangle", hint: "Basic rectangle block", kind: "shape" },
      { id: "circle", label: "Circle", hint: "Round accent shape", kind: "shape" },
      { id: "line", label: "Line", hint: "Divider / connector line", kind: "line" }
    ]
  },
  {
    id: "frames",
    label: "Frames",
    items: [{ id: "frame", label: "Photo Frame", hint: "Drop or replace image later", kind: "frame" }]
  },
  {
    id: "grids",
    label: "Grids",
    items: [
      { id: "grid_2_col", label: "2 Column Grid", hint: "Two equal columns", kind: "grid" },
      { id: "grid_3_col", label: "3 Column Grid", hint: "Three equal columns", kind: "grid" },
      { id: "grid_2x2", label: "2×2 Grid", hint: "Four-cell photo grid", kind: "grid" }
    ]
  }
];
