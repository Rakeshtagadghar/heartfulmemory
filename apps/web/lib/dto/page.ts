import { z } from "zod";

export const pageSizePresetSchema = z.enum(["A4", "US_LETTER", "BOOK_6X9", "BOOK_8_5X11"]);

export const pageMarginsSchema = z.object({
  top: z.number(),
  right: z.number(),
  bottom: z.number(),
  left: z.number(),
  unit: z.literal("px")
});

export const pageGridSchema = z.object({
  enabled: z.boolean(),
  columns: z.number(),
  gutter: z.number(),
  rowHeight: z.number(),
  showGuides: z.boolean()
});

export const pageBackgroundSchema = z.object({
  fill: z.string()
});

export const pageTypeSchema = z.enum([
  "COVER",
  "TABLE_OF_CONTENTS",
  "TABLE_OF_CONTENTS_CONTINUATION",
  "CHAPTER_COVER",
  "PAGE"
]).optional();

export const pageDtoSchema = z.object({
  id: z.string().min(1),
  storybook_id: z.string().min(1),
  owner_id: z.string().min(1),
  order_index: z.number().int(),
  title: z.string().optional(),
  is_hidden: z.boolean().optional(),
  is_locked: z.boolean().optional(),
  page_type: pageTypeSchema,
  show_in_toc: z.boolean().optional(),
  size_preset: pageSizePresetSchema,
  width_px: z.number(),
  height_px: z.number(),
  margins: pageMarginsSchema,
  grid: pageGridSchema,
  background: pageBackgroundSchema,
  created_at: z.string(),
  updated_at: z.string()
});


export type PageDTO = z.infer<typeof pageDtoSchema>;
