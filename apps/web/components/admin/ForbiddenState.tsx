import Link from "next/link";

export function ForbiddenState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-12">
        <p className="text-4xl font-bold text-white/20">403</p>
        <h1 className="mt-3 text-lg font-semibold text-white/80">Access Denied</h1>
        <p className="mt-2 max-w-sm text-sm text-white/50">
          You do not have permission to view this page. If you believe this is an error, contact your system administrator.
        </p>
        <Link
          href="/app"
          className="mt-6 inline-block rounded-lg bg-white/[0.08] px-4 py-2 text-sm text-white/80 transition hover:bg-white/[0.12]"
        >
          Return to App
        </Link>
      </div>
    </div>
  );
}
