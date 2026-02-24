import { z } from "zod";

export const blockTypeSchema = z.enum(["TEXT", "IMAGE", "VIDEO", "GIF", "EMBED"]);

export const blockDtoSchema = z.object({
  id: z.string().min(1),
  chapter_id: z.string().min(1),
  storybook_id: z.string().min(1),
  owner_id: z.string().min(1),
  type: blockTypeSchema,
  order_index: z.number().int(),
  version: z.number().int().default(1),
  content: z.record(z.string(), z.unknown()).default({}),
  created_at: z.string(),
  updated_at: z.string()
});

export type BlockDTO = z.infer<typeof blockDtoSchema>;
