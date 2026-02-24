import { NextResponse } from "next/server";
import { getAuthSession } from "../../../lib/auth/server";
import { onboardingInputSchema, updateOnboardingForUser } from "../../../lib/profile";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const session = await getAuthSession();
  const user = session?.user;
  if (!user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const parsed = onboardingInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message || "Invalid onboarding data." },
      { status: 400 }
    );
  }

  const result = await updateOnboardingForUser(user, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
