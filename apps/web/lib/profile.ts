import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { Session } from "next-auth";
import { convexMutation, convexQuery, anyApi, getConvexUrl } from "./convex/ops";
import { logWarn } from "./server-log";

export const ONBOARDING_GOALS = [
  "create_storybook",
  "gift_storybook",
  "capture_parent_stories"
] as const;

export const onboardingInputSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  goal: z.enum(ONBOARDING_GOALS),
  marketingConsent: z.boolean().default(false)
});

export type OnboardingGoal = (typeof ONBOARDING_GOALS)[number];
export type OnboardingInput = z.infer<typeof onboardingInputSchema>;

export type ProfileRecord = {
  id: string;
  display_name: string | null;
  email: string | null;
  onboarding_completed: boolean;
  onboarding_goal: string | null;
  marketing_consent: boolean | null;
  locale: string | null;
  timezone: string | null;
  created_at?: string;
};

type AuthUserLike = NonNullable<Session["user"]>;

const profilesFile = path.join(process.cwd(), ".data", "profiles.json");

async function readProfilesFile(): Promise<Record<string, ProfileRecord>> {
  try {
    const raw = await readFile(profilesFile, "utf8");
    return JSON.parse(raw) as Record<string, ProfileRecord>;
  } catch {
    return {};
  }
}

async function writeProfilesFile(records: Record<string, ProfileRecord>) {
  await mkdir(path.dirname(profilesFile), { recursive: true });
  await writeFile(profilesFile, JSON.stringify(records, null, 2), "utf8");
}

function fallbackProfile(user: AuthUserLike): ProfileRecord {
  return {
    id: user.id,
    display_name: user.name ?? null,
    email: user.email ?? null,
    onboarding_completed: false,
    onboarding_goal: null,
    marketing_consent: null,
    locale: null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null
  };
}

async function getOrCreateLocalProfile(user: AuthUserLike) {
  const records = await readProfilesFile();
  if (records[user.id]) {
    records[user.id].email = user.email ?? records[user.id].email;
    records[user.id].display_name = records[user.id].display_name || user.name || null;
    await writeProfilesFile(records);
  } else {
    records[user.id] = {
      ...fallbackProfile(user),
      created_at: new Date().toISOString()
    };
    await writeProfilesFile(records);
  }

  return records[user.id];
}

export async function getOrCreateProfileForUser(user: AuthUserLike): Promise<ProfileRecord> {
  if (!getConvexUrl()) {
    return getOrCreateLocalProfile(user);
  }

  const result = await convexMutation<ProfileRecord>(anyApi.users.upsertCurrentUser, {
    userId: user.id,
    email: user.email ?? null,
    displayName: user.name ?? null,
    locale: null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null
  });

  if (!result.ok) {
    logWarn("convex_profile_upsert_error", result.error);
    return getOrCreateLocalProfile(user);
  }

  return result.data;
}

export async function updateOnboardingForUser(user: AuthUserLike, input: OnboardingInput) {
  const parsed = onboardingInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message || "Invalid onboarding payload."
    };
  }

  if (!getConvexUrl()) {
    const records = await readProfilesFile();
    const current = records[user.id] ?? (await getOrCreateLocalProfile(user));
    records[user.id] = {
      ...current,
      email: user.email ?? current.email,
      display_name: parsed.data.displayName,
      onboarding_goal: parsed.data.goal,
      marketing_consent: parsed.data.marketingConsent,
      onboarding_completed: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? current.timezone
    };
    await writeProfilesFile(records);
    return { ok: true as const };
  }

  const result = await convexMutation<{ ok: boolean }>(anyApi.users.completeOnboarding, {
    userId: user.id,
    email: user.email ?? null,
    displayName: parsed.data.displayName,
    goal: parsed.data.goal,
    marketingConsent: parsed.data.marketingConsent,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  return { ok: true as const };
}

export async function getCurrentProfileByUserId(userId: string) {
  if (!getConvexUrl()) {
    const records = await readProfilesFile();
    return records[userId] ?? null;
  }

  const result = await convexQuery<ProfileRecord | null>(anyApi.users.getCurrentUser, { userId });
  return result.ok ? result.data : null;
}
