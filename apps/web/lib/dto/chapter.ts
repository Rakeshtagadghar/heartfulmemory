import { z } from "zod";

export const chapterStatusSchema = z.enum(["DRAFT", "FINAL"]);

export const chapterDtoSchema = z.object({
  id: z.string().min(1),
  storybook_id: z.string().min(1),
  owner_id: z.string().min(1),
  title: z.string(),
  status: chapterStatusSchema,
  order_index: z.number().int(),
  summary: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string()
});

export type ChapterDTO = z.infer<typeof chapterDtoSchema>;
