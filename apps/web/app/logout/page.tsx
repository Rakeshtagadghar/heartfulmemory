"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function LogoutPage() {
  useEffect(() => {
    void signOut({ callbackUrl: "/login?loggedOut=1" });
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-6 py-16 text-white">
      <p className="text-sm text-white/70">Signing you out...</p>
    </main>
  );
}
