import { normalizeCropModelV1, serializeCropModelV1 } from "../models/cropModel";

export function buildApplyCropPatch(input: {
  cropDraft: Record<string, unknown> | null | undefined;
  expectedVersion?: number | null;
}) {
  const crop = normalizeCropModelV1(input.cropDraft ?? undefined);
  return {
    crop: serializeCropModelV1({ ...crop, enabled: true }),
    ...(typeof input.expectedVersion === "number" ? { expectedVersion: input.expectedVersion } : {})
  };
}
