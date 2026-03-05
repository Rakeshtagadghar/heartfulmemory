"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { ContinueWithGoogleButton } from "./ContinueWithGoogleButton";
import { buildPostLoginPath, googleAuthorizationParams } from "../../lib/auth/googleOAuthParams";

type Props = {
  returnTo: string;
};

export function GoogleChooserActions({ returnTo }: Props) {
  return (
    <div className="space-y-3">
      <ContinueWithGoogleButton
        onClick={() => {
          void signIn("google", {
            callbackUrl: buildPostLoginPath(returnTo)
          }, googleAuthorizationParams);
        }}
      />
      <p className="text-center text-sm text-white/65">
        Prefer email sign-in?{" "}
        <Link href={`/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`} className="underline underline-offset-2 hover:text-white">
          Use email instead
        </Link>
      </p>
    </div>
  );
}

