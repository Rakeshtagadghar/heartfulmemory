import Link from "next/link";
import { requireAdminWithPermission } from "../../../../lib/admin/requireAdmin";
import { getUserDetail, writeAuditLog } from "../../../../lib/admin/adminOps";
import { redirect } from "next/navigation";

function StatusBadge({ status, type }: { status: string; type?: "account" | "project" | "export" | "onboarding" }) {
  const colorMap: Record<string, string> = {
    active: "bg-green-500/15 text-green-400",
    pending_deletion: "bg-red-500/15 text-red-400",
    deleted: "bg-white/10 text-white/40",
    DRAFT: "bg-amber-500/15 text-amber-400",
    ACTIVE: "bg-green-500/15 text-green-400",
    ARCHIVED: "bg-white/10 text-white/40",
    done: "bg-green-500/15 text-green-400",
    error: "bg-red-500/15 text-red-400",
    queued: "bg-blue-500/15 text-blue-300",
    running: "bg-blue-500/15 text-blue-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${colorMap[status] ?? "bg-white/10 text-white/50"}`}>
      {status}
    </span>
  );
}

function timeAgo(ts: number | null): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const admin = await requireAdminWithPermission("users.view");
  const { userId: rawUserId } = await params;
  const userId = decodeURIComponent(rawUserId);
  const user = await getUserDetail(userId);

  if (!user) {
    console.error("[admin] User not found, redirecting. userId:", userId, "rawUserId:", rawUserId);
    redirect("/admin/users");
  }

  void writeAuditLog({
    adminUserId: admin.adminId,
    actorUserId: admin.userId,
    eventType: "admin_user_viewed",
    resourceType: "user",
    resourceId: userId,
    action: "view",
  });

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/users" className="text-xs text-white/40 hover:text-white/70">
          &larr; Back to Users
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User summary card */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 lg:col-span-1">
          <h1 className="text-lg font-semibold text-white/90">
            {user.displayName || "Unnamed User"}
          </h1>
          <p className="mt-1 text-sm text-white/50">{user.email ?? "No email"}</p>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/40">Status</span>
              <StatusBadge status={user.accountStatus} type="account" />
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Onboarding</span>
              <span className={user.onboardingCompleted ? "text-green-400" : "text-amber-400"}>
                {user.onboardingCompleted ? "Completed" : "Incomplete"}
              </span>
            </div>
            {user.onboardingGoal && (
              <div className="flex justify-between">
                <span className="text-white/40">Goal</span>
                <span className="text-white/60">{user.onboardingGoal}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-white/40">Auth Providers</span>
              <span className="text-white/60">{user.authProviders.join(", ") || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Email Verified</span>
              <span className="text-white/60">
                {user.emailVerifiedAt ? new Date(user.emailVerifiedAt).toLocaleDateString() : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Last Active</span>
              <span className="text-white/60">{timeAgo(user.lastActivityAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Signed Up</span>
              <span className="text-white/60">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-white/30">User ID</p>
            <p className="mt-0.5 break-all font-mono text-xs text-white/40">{user.id}</p>
          </div>
        </div>

        {/* Projects list */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-medium text-white/60">
            Projects ({user.projects.length})
          </h2>

          {user.projects.length === 0 ? (
            <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/30">
              No projects yet.
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {user.projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/projects/${p.id}`}
                  className="block rounded-xl border border-white/8 bg-white/[0.02] p-4 transition hover:border-white/15 hover:bg-white/[0.04]"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-white/80">{p.title}</h3>
                    <StatusBadge status={p.status} type="project" />
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-white/40">
                    <span>{p.pageCount} pages</span>
                    <span>{p.chapterCount} chapters</span>
                    <span>{p.bookMode}</span>
                    {p.flowStatus && <span>Flow: {p.flowStatus}</span>}
                    {p.latestExportStatus && (
                      <span>
                        Export: <StatusBadge status={p.latestExportStatus} type="export" />
                      </span>
                    )}
                    <span>Updated {timeAgo(p.updatedAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
