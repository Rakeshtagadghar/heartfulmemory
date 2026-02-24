import { z } from "zod";

export const bookModeSchema = z.enum(["DIGITAL", "PRINT"]);
export const bookStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "DELETED"]);

export const storybookDtoSchema = z.object({
  id: z.string().min(1),
  owner_id: z.string().min(1),
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  book_mode: bookModeSchema,
  status: bookStatusSchema,
  cover_asset_id: z.string().min(1).nullable().optional(),
  settings: z.record(z.string(), z.unknown()).default({}),
  created_at: z.string(),
  updated_at: z.string()
});

export type StorybookDTO = z.infer<typeof storybookDtoSchema>;

export const storybookPatchSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    subtitle: z.string().max(240).nullable().optional(),
    book_mode: bookModeSchema.optional(),
    status: bookStatusSchema.optional(),
    settings: z.record(z.string(), z.unknown()).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });
