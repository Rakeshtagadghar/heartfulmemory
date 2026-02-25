import { z } from "zod";

export const frameTypeSchema = z.enum(["TEXT", "IMAGE", "SHAPE", "LINE", "FRAME", "GROUP"]);

export const frameDtoSchema = z.object({
  id: z.string().min(1),
  storybook_id: z.string().min(1),
  page_id: z.string().min(1),
  owner_id: z.string().min(1),
  type: frameTypeSchema,
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  z_index: z.number().int(),
  locked: z.boolean(),
  style: z.record(z.string(), z.unknown()).default({}),
  content: z.record(z.string(), z.unknown()).default({}),
  crop: z.record(z.string(), z.unknown()).nullable().default(null),
  version: z.number().int().default(1),
  created_at: z.string(),
  updated_at: z.string()
});

export type FrameDTO = z.infer<typeof frameDtoSchema>;
