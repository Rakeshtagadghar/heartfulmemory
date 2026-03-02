/**
 * Tiptap JSON document types.
 * Pure TypeScript – no @tiptap packages required.
 */

export type TiptapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
};

export type TiptapDoc = {
  type: "doc";
  content?: TiptapNode[];
};
