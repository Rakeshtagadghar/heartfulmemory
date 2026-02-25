import limits from "../../config/limits.default.json";

export type R2FreeTierCaps = {
  hardStopEnabled: boolean;
  monthlyStorageBytesCap: number;
  monthlyClassAOpsCap: number;
  monthlyClassBOpsCap: number;
};

function positiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function getR2FreeTierCaps(): R2FreeTierCaps {
  return {
    hardStopEnabled:
      (process.env.R2_FREE_TIER_HARD_STOP ?? String(limits.r2FreeTier.hardStopEnabled)).toLowerCase() !==
      "false",
    monthlyStorageBytesCap: positiveInt(
      process.env.R2_FREE_TIER_STORAGE_BYTES_CAP,
      limits.r2FreeTier.monthlyStorageBytesCap
    ),
    monthlyClassAOpsCap: positiveInt(
      process.env.R2_FREE_TIER_CLASS_A_OPS_CAP,
      limits.r2FreeTier.monthlyClassAOpsCap
    ),
    monthlyClassBOpsCap: positiveInt(
      process.env.R2_FREE_TIER_CLASS_B_OPS_CAP,
      limits.r2FreeTier.monthlyClassBOpsCap
    )
  };
}

export function getCurrentMonthKey(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
