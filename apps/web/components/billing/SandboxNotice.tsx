import { alphaMessaging } from "../../content/alphaMessaging";

export function SandboxNotice() {
  return (
    <div className="mt-4 rounded-xl border-2 border-amber-300/55 bg-amber-500/10 px-4 py-3">
      <p className="text-lg font-extrabold tracking-[0.08em] text-amber-100 sm:text-xl">
        {alphaMessaging.sandboxHeadline}
      </p>
      <p className="mt-1 text-base font-bold text-white">
        {alphaMessaging.sandboxSubheadline}
      </p>
      <p className="mt-1 text-sm text-amber-50/95">
        {alphaMessaging.sandboxGuidance}
      </p>
    </div>
  );
}

