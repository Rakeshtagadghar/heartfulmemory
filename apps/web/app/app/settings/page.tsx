import Link from "next/link";
import { Card } from "../../../components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Settings</p>
        <h1 className="mt-2 font-display text-4xl text-parchment">Workspace settings</h1>
        <p className="mt-3 text-sm leading-7 text-white/70">
          Settings UI is being expanded. For now, you can update your onboarding preferences.
        </p>
        <div className="mt-5">
          <Link
            href="/app/onboarding"
            className="inline-flex h-10 items-center rounded-xl border border-white/15 bg-white/[0.03] px-4 text-sm font-semibold text-white hover:bg-white/[0.06]"
          >
            Open onboarding settings
          </Link>
        </div>
      </Card>
    </div>
  );
}
