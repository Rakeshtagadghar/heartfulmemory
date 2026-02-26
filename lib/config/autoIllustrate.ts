function readEnv(name: string): string | undefined {
  if (typeof process === "undefined" || !process.env) return undefined;
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseProviderMode(value: string | undefined) {
  const normalized = (value ?? "").toLowerCase();
  if (normalized === "unsplash" || normalized === "pexels" || normalized === "both") return normalized;
  return "both" as const;
}

export function getAutoIllustrateConfig() {
  return {
    minShortSideFullPage: parsePositiveInt(readEnv("AUTOILLUSTRATE_MIN_SHORTSIDE_FULLPAGE"), 2600),
    minShortSideLarge: parsePositiveInt(readEnv("AUTOILLUSTRATE_MIN_SHORTSIDE_LARGE"), 1800),
    minShortSideSmall: parsePositiveInt(readEnv("AUTOILLUSTRATE_MIN_SHORTSIDE_SMALL"), 1000),
    providerModeDefault: parseProviderMode(readEnv("AUTOILLUSTRATE_PROVIDER_MODE_DEFAULT")),
    maxCandidatesPerSlot: parsePositiveInt(readEnv("AUTOILLUSTRATE_MAX_CANDIDATES_PER_SLOT"), 24),
    maxDownloadMb: parsePositiveInt(readEnv("AUTOILLUSTRATE_MAX_DOWNLOAD_MB"), 15),
    rateLimitPerUser: parsePositiveInt(readEnv("AUTOILLUSTRATE_RATE_LIMIT_PER_USER"), 12)
  };
}

export type AutoIllustrateConfig = ReturnType<typeof getAutoIllustrateConfig>;

