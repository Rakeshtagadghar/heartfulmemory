import Link from "next/link";
import { redirect } from "next/navigation";
import { hasPermission } from "../../../../../../packages/shared/admin/rbac";
import { formatAdminTemplateEnumLabel } from "../../../../../../packages/shared/admin/templates";
import { TemplateLifecycleActions } from "../../../../components/admin/TemplateLifecycleActions";
import { TemplateMetadataForm } from "../../../../components/admin/TemplateMetadataForm";
import { TemplateQuestionsEditor } from "../../../../components/admin/TemplateQuestionsEditor";
import { getAdminTemplateDetail, writeAuditLog } from "../../../../lib/admin/adminOps";
import { requireAdminWithPermission } from "../../../../lib/admin/requireAdmin";

function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "good" | "warning";
}) {
  const classes =
    tone === "good"
      ? "bg-emerald-500/15 text-emerald-300"
      : tone === "warning"
        ? "bg-amber-500/15 text-amber-300"
        : "bg-white/10 text-white/65";

  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ${classes}`}>{label}</span>;
}

function InfoRow({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-white/40">{label}</span>
      <span className="text-right text-white/75">{value ?? "-"}</span>
    </div>
  );
}

function formatCompatibilityState(value: boolean | null) {
  if (value === true) return "Supported";
  if (value === false) return "Not supported";
  return "Unknown";
}

export default async function AdminTemplateDetailPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const admin = await requireAdminWithPermission("templates.view");
  const { templateId: rawTemplateId } = await params;
  const templateId = decodeURIComponent(rawTemplateId);
  const template = await getAdminTemplateDetail(templateId);
  const canManage = hasPermission(admin.role, "templates.manage");
  const canPublish = hasPermission(admin.role, "templates.publish");
  const canArchive = hasPermission(admin.role, "templates.archive");

  if (!template) {
    redirect("/admin/templates");
  }

  void writeAuditLog({
    adminUserId: admin.adminId,
    actorUserId: admin.userId,
    eventType: "admin_template_viewed",
    resourceType: "template",
    resourceId: templateId,
    action: "view",
  });

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/templates" className="text-xs text-white/40 hover:text-white/70">
          &larr; Back to Templates
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-white">{template.name}</h1>
                <p className="mt-2 max-w-3xl text-sm text-white/55">
                  {template.description ?? "No subtitle or description is configured for this template yet."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge
                    label={formatAdminTemplateEnumLabel(template.status)}
                    tone={template.status === "published" ? "good" : template.status === "disabled" ? "warning" : "neutral"}
                  />
                  <Badge label={formatAdminTemplateEnumLabel(template.visibility)} />
                  <Badge label={formatAdminTemplateEnumLabel(template.guidedLevel)} />
                  <Badge label={formatAdminTemplateEnumLabel(template.type)} />
                </div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 lg:w-72">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">Template actions</p>
                <p className="mt-2 text-sm text-white/65">
                  Manage metadata, publication state, defaults, and archive safety from one place.
                </p>
                <p className="mt-3 text-xs text-white/35">
                  {canManage ? "Your role can edit metadata here." : "Your role is view-only for templates."}
                </p>
                <Link
                  href={`/admin/templates/${encodeURIComponent(template.id)}/builder`}
                  className="mt-4 inline-flex rounded-lg bg-white/[0.08] px-3 py-2 text-sm text-white transition hover:bg-white/[0.14]"
                >
                  Open layout builder
                </Link>
              </div>
            </div>
          </section>

          {canManage ? <TemplateMetadataForm template={template} /> : null}

          <TemplateQuestionsEditor template={template} canManage={canManage} />

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-medium text-white/75">Catalog metadata</h2>
            <div className="mt-3 divide-y divide-white/5">
              <InfoRow label="Template id" value={template.id} />
              <InfoRow label="Slug" value={template.slug} />
              <InfoRow label="Category" value={formatAdminTemplateEnumLabel(template.category)} />
              <InfoRow label="Display order" value={template.displayOrder} />
              <InfoRow label="Is default" value={template.isDefault ? "Yes" : "No"} />
              <InfoRow label="Source" value={template.source} />
              <InfoRow
                label="Updated"
                value={template.updatedAt > 0 ? new Date(template.updatedAt).toLocaleString("en-GB") : "Seeded"}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-medium text-white/75">Structure</h2>
            <div className="mt-4 space-y-3">
              {template.chapters.map((chapter, index) => (
                <div key={chapter.chapterKey} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-white/35">Chapter {index + 1}</p>
                      <p className="mt-1 text-sm font-medium text-white/80">{chapter.title}</p>
                      {chapter.subtitle ? <p className="mt-1 text-sm text-white/45">{chapter.subtitle}</p> : null}
                    </div>
                    <Badge label={`${chapter.questionCount} prompts`} />
                  </div>
                  <p className="mt-3 font-mono text-[11px] text-white/30">{chapter.chapterKey}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-medium text-white/75">Compatibility</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/35">Portrait</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {formatCompatibilityState(template.compatibility.supportsPortrait)}
                </p>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/35">Landscape</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {formatCompatibilityState(template.compatibility.supportsLandscape)}
                </p>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/35">Reflow mode</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {formatCompatibilityState(template.compatibility.supportsReflowMode)}
                </p>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/35">PDF export</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {formatCompatibilityState(template.compatibility.supportsPdfExport)}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {template.compatibility.warnings.map((warning) => (
                <div key={warning} className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100">
                  {warning}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-medium text-white/75">Usage</h2>
            <div className="mt-3 divide-y divide-white/5">
              <InfoRow label="Total storybooks" value={template.usageSummary.totalStorybooks} />
              <InfoRow label="Active storybooks" value={template.usageSummary.activeStorybooks} />
              <InfoRow
                label="Archive safety"
                value={template.usageSummary.canArchiveSafely ? "Safe" : "Blocked"}
              />
            </div>
            <div className="mt-4 space-y-2">
              {template.usageSummary.warnings.length === 0 ? (
                <p className="text-sm text-white/45">No current usage warnings for this template.</p>
              ) : (
                template.usageSummary.warnings.map((warning) => (
                  <div key={warning} className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-sm text-white/60">
                    {warning}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-medium text-white/75">Recent linked storybooks</h2>
            {template.recentStorybooks.length === 0 ? (
              <p className="mt-3 text-sm text-white/45">No storybooks currently reference this template.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {template.recentStorybooks.map((storybook) => (
                  <Link
                    key={storybook.id}
                    href={`/admin/projects/${encodeURIComponent(storybook.id)}`}
                    className="block rounded-xl border border-white/8 bg-white/[0.02] p-4 transition hover:border-white/15 hover:bg-white/[0.04]"
                  >
                    <p className="text-sm font-medium text-white/80">{storybook.title}</p>
                    <p className="mt-1 text-xs text-white/40">{storybook.status} | owner {storybook.ownerId}</p>
                    <p className="mt-2 text-xs text-white/30">
                      Updated {new Date(storybook.updatedAt).toLocaleString("en-GB")}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {(canManage || canPublish || canArchive) ? (
            <TemplateLifecycleActions
              templateId={template.id}
              status={template.status}
              isDefault={template.isDefault}
              actionState={template.actionState}
              canManage={canManage}
              canPublish={canPublish}
              canArchive={canArchive}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
