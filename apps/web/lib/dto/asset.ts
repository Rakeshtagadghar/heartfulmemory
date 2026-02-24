import { z } from "zod";

export const assetSourceSchema = z.enum([
  "UPLOAD",
  "UNSPLASH",
  "PEXELS",
  "PIXABAY",
  "OPENVERSE",
  "RAWPIXEL_PD",
  "VECTEEZY"
]);

export const assetDtoSchema = z.object({
  id: z.string().min(1),
  owner_id: z.string().min(1),
  source: assetSourceSchema,
  source_asset_id: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
  storage_provider: z.string().nullable().optional(),
  storage_bucket: z.string().nullable().optional(),
  storage_key: z.string().nullable().optional(),
  mime_type: z.string().nullable().optional(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  duration_seconds: z.number().int().nullable().optional(),
  size_bytes: z.number().int().nullable().optional(),
  checksum: z.string().nullable().optional(),
  license: z.unknown().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string()
});

export type AssetDTO = z.infer<typeof assetDtoSchema>;
