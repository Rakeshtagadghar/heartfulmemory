export type CropTransactionIntent = "apply_crop" | "cancel_crop";

export type CropTransactionRecord = {
  intent: CropTransactionIntent;
  frameId: string;
  at: number;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
};

export function createCropApplyTransaction(input: {
  frameId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}): CropTransactionRecord {
  return {
    intent: "apply_crop",
    frameId: input.frameId,
    at: Date.now(),
    before: input.before,
    after: input.after
  };
}

export function createCropCancelTransaction(frameId: string): CropTransactionRecord {
  return {
    intent: "cancel_crop",
    frameId,
    at: Date.now(),
    before: null,
    after: null
  };
}
