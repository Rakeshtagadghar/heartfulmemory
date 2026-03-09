import Link from "next/link";
import { requireAdminWithPermission } from "../../../../lib/admin/requireAdmin";
import { getAdminProjectExportHistory, getProjectDetail, writeAuditLog } from "../../../../lib/admin/adminOps";
import { redirect } from "next/navigation";
import { hasPermission } from "../../../../../../packages/shared/admin/rbac";
import { ProjectExportHistoryPanel } from "../../../../components/admin/ProjectExportHistoryPanel";

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    active: "bg-green-500/15 text-green-400",
    DRAFT: "bg-amber-500/15 text-amber-400",
    ACTIVE: "bg-green-500/15 text-green-400",
    ARCHIVED: "bg-white/10 text-white/40",
    DELETED: "bg-red-500/15 text-red-400",
    done: "bg-green-500/15 text-green-400",
    error: "bg-red-500/15 text-red-400",
    queued: "bg-blue-500/15 text-blue-300",
    running: "bg-blue-500/15 text-blue-300",
    not_started: "bg-white/10 text-white/40",
    in_progress: "bg-blue-500/15 text-blue-300",
    completed: "bg-green-500/15 text-green-400",
    needs_questions: "bg-amber-500/15 text-amber-400",
    needs_upload_photos: "bg-amber-500/15 text-amber-400",
    populating: "bg-blue-500/15 text-blue-300",
    ready_in_studio: "bg-green-500/15 text-green-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${colorMap[status] ?? "bg-white/10 text-white/50"}`}>
      {status}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-white/40">{label}</span>
      <span className="text-white/70">{value ?? "—"}</span>
    </div>
  );
}

export default async function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const admin = await requireAdminWithPermission("projects.view");
  const { projectId: rawProjectId } = await params;
  const projectId = decodeURIComponent(rawProjectId);
  const project = await getProjectDetail(projectId);

  if (!project) {
    console.error("[admin] Project not found, redirecting. projectId:", projectId);
    redirect("/admin/users");
  }

  void writeAuditLog({
    adminUserId: admin.adminId,
    actorUserId: admin.userId,
    eventType: "admin_project_viewed",
    resourceType: "project",
    resourceId: projectId,
    action: "view",
  });

  const canViewUsers = hasPermission(admin.role, "users.view");
  const exportHistory = await getAdminProjectExportHistory(projectId, 8, {
    includeOwnerEmail: canViewUsers,
    includeFailureSummary: hasPermission(admin.role, "support.view"),
  });

  return (
    <div>
      <div className="mb-6 flex gap-2 text-xs text-white/40">
        {canViewUsers && project.owner && (
          <>
            <Link href={`/admin/users/${project.owner.id}`} className="hover:text-white/70">
              &larr; {project.owner.displayName ?? project.owner.email ?? "User"}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-white/60">{project.title}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project summary */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 lg:col-span-1">
          <h1 className="text-lg font-semibold text-white/90">{project.title}</h1>
          {project.subtitle && (
            <p className="mt-1 text-sm text-white/50">{project.subtitle}</p>
          )}

          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-white/40">Status</span>
              <StatusBadge status={project.status} />
            </div>
            <InfoRow label="Book Mode" value={project.bookMode} />
            <InfoRow label="Orientation" value={String(project.orientation)} />
            {project.pageSize && <InfoRow label="Page Size" value={String(project.pageSize)} />}
            {project.flowStatus && (
              <div className="flex justify-between py-1.5">
                <span className="text-white/40">Flow Status</span>
                <StatusBadge status={project.flowStatus} />
              </div>
            )}
            {project.photoStatus && <InfoRow label="Photo Status" value={project.photoStatus} />}
            {project.templateId && <InfoRow label="Template" value={project.templateId} />}
            <InfoRow label="Created" value={new Date(project.createdAt).toLocaleDateString()} />
            <InfoRow label="Updated" value={new Date(project.updatedAt).toLocaleString()} />
          </div>

          {/* Owner card */}
          {project.owner && (
            <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-white/30">Owner</p>
              {canViewUsers ? (
                <Link
                  href={`/admin/users/${project.owner.id}`}
                  className="mt-0.5 block text-sm text-white/70 hover:text-white hover:underline"
                >
                  {project.owner.displayName ?? project.owner.email ?? project.owner.id}
                </Link>
              ) : (
                <p className="mt-0.5 text-sm text-white/60">
                  {project.owner.displayName ?? "User"}
                </p>
              )}
            </div>
          )}

          {/* ID */}
          <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-white/30">Project ID</p>
            <p className="mt-0.5 break-all font-mono text-xs text-white/40">{project.id}</p>
          </div>
        </div>

        {/* Right column: counts, chapters, exports */}
        <div className="space-y-6 lg:col-span-2">
          {/* Counts */}
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(project.counts).map(([key, val]) => (
              <div key={key} className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-center">
                <p className="text-2xl font-semibold text-white/80">{val}</p>
                <p className="mt-1 text-[11px] capitalize text-white/40">{key}</p>
              </div>
            ))}
          </div>

          {/* Chapters */}
          <div>
            <h2 className="text-sm font-medium text-white/60">
              Chapters ({project.chapterSummaries.length})
            </h2>
            {project.chapterSummaries.length === 0 ? (
              <p className="mt-2 text-xs text-white/30">No chapters.</p>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
                      <th className="px-2 py-1.5">#</th>
                      <th className="px-2 py-1.5">Title</th>
                      <th className="px-2 py-1.5">Key</th>
                      <th className="px-2 py-1.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.chapterSummaries.map((ch) => (
                      <tr key={ch.id} className="border-b border-white/5">
                        <td className="px-2 py-1.5 text-xs text-white/40">{ch.orderIndex + 1}</td>
                        <td className="px-2 py-1.5 text-xs text-white/70">{ch.title}</td>
                        <td className="px-2 py-1.5 font-mono text-xs text-white/40">{ch.chapterKey}</td>
                        <td className="px-2 py-1.5"><StatusBadge status={ch.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <ProjectExportHistoryPanel
            items={exportHistory?.items ?? []}
            canViewProject
          />
        </div>
      </div>
    </div>
  );
}
