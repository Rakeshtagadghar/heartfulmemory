"use client";

import { signOut } from "next-auth/react";
import { trackAuthLogout } from "../../lib/analytics/events_auth";

export function LogoutButton() {
  return (
    <button
      type="button"
      className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
      onClick={() => {
        trackAuthLogout({ source: "app_shell" });
        void signOut({ callbackUrl: "/login?loggedOut=1" });
      }}
    >
      Log out
    </button>
  );
}
