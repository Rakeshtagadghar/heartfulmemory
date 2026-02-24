export type TextBlockContent = {
  kind: "text_v0";
  html: string;
  prompt?: string;
};

export type ImagePlaceholderBlockContent = {
  kind: "image_placeholder_v0";
  caption: string;
  placementPreset: "full" | "left" | "right" | "inline";
  sizePct: number;
};

export function createTextBlockContent(prompt?: string): TextBlockContent {
  return {
    kind: "text_v0",
    html: "",
    prompt
  };
}

export function createImagePlaceholderContent(): ImagePlaceholderBlockContent {
  return {
    kind: "image_placeholder_v0",
    caption: "",
    placementPreset: "inline",
    sizePct: 60
  };
}

export function normalizeTextBlockContent(content: unknown): TextBlockContent {
  if (!content || typeof content !== "object") {
    return createTextBlockContent();
  }

  const candidate = content as Partial<TextBlockContent>;
  return {
    kind: "text_v0",
    html: typeof candidate.html === "string" ? candidate.html : "",
    prompt: typeof candidate.prompt === "string" ? candidate.prompt : undefined
  };
}

export function normalizeImagePlaceholderContent(content: unknown): ImagePlaceholderBlockContent {
  if (!content || typeof content !== "object") {
    return createImagePlaceholderContent();
  }

  const candidate = content as Partial<ImagePlaceholderBlockContent>;
  return {
    kind: "image_placeholder_v0",
    caption: typeof candidate.caption === "string" ? candidate.caption : "",
    placementPreset:
      candidate.placementPreset === "full" ||
      candidate.placementPreset === "left" ||
      candidate.placementPreset === "right" ||
      candidate.placementPreset === "inline"
        ? candidate.placementPreset
        : "inline",
    sizePct:
      typeof candidate.sizePct === "number" && Number.isFinite(candidate.sizePct)
        ? Math.max(10, Math.min(100, Math.round(candidate.sizePct)))
        : 60
  };
}

