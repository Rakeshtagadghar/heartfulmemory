import { z } from "zod";

export const blockTypeSchema = z.enum(["TEXT", "IMAGE", "VIDEO", "GIF", "EMBED"]);

export const blockDtoSchema = z.object({
  id: z.string().uuid(),
  chapter_id: z.string().uuid(),
  storybook_id: z.string().uuid(),
  owner_id: z.string().uuid(),
  type: blockTypeSchema,
  order_index: z.number().int(),
  content: z.record(z.string(), z.unknown()).default({}),
  created_at: z.string(),
  updated_at: z.string()
});

export type BlockDTO = z.infer<typeof blockDtoSchema>;
