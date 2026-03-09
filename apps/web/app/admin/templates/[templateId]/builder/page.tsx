import Link from "next/link";
import { redirect } from "next/navigation";
import { hasPermission } from "../../../../../../../packages/shared/admin/rbac";
import {
  buildAdminTemplateLayoutBuilderLoadResponse,
  buildAdminTemplateLayoutPreview,
} from "../../../../../../../packages/shared/admin/templateLayoutBuilder";
import { TemplateLayoutBuilderShell } from "../../../../../components/admin/TemplateLayoutBuilderShell";
import {
  getAdminTemplateDetail,
  getAdminTemplateLayouts,
  writeAuditLog,
} from "../../../../../lib/admin/adminOps";
import { requireAdminWithPermission } from "../../../../../lib/admin/requireAdmin";

export default async function AdminTemplateBuilderPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const admin = await requireAdminWithPermission("templates.view");
  const { templateId: rawTemplateId } = await params;
  const templateId = decodeURIComponent(rawTemplateId);
  const [template, layouts] = await Promise.all([
    getAdminTemplateDetail(templateId),
    getAdminTemplateLayouts(templateId),
  ]);

  if (!template || !layouts) {
    redirect("/admin/templates");
  }

  const canManage = hasPermission(admin.role, "templates.manage");
  const initialData = buildAdminTemplateLayoutBuilderLoadResponse({
    templateId: template.id,
    templateName: template.name,
    templateStatus: template.status,
    canManage,
    lastSavedAt: template.updatedAt,
    publishedVersionRef: template.status === "published" ? `template:${template.id}:v${template.updatedAt}` : null,
    layoutDefinition: layouts.layoutDefinition,
  });
  const initialPreview = buildAdminTemplateLayoutPreview(
    layouts.layoutDefinition,
    initialData.selectedLayoutId ?? layouts.layoutDefinition.pageLayouts[0]?.pageLayoutId ?? "",
    "sample_content"
  );

  void writeAuditLog({
    adminUserId: admin.adminId,
    actorUserId: admin.userId,
    eventType: "admin_template_builder_opened",
    resourceType: "template",
    resourceId: templateId,
    action: "open_layout_builder",
    metadataJson: {
      canManage,
      selectedLayoutId: initialData.selectedLayoutId,
    },
  });

  return (
    <div>
      <div className="mb-6">
        <Link href={`/admin/templates/${encodeURIComponent(template.id)}`} className="text-xs text-white/40 hover:text-white/70">
          &larr; Back to Template Detail
        </Link>
      </div>
      <TemplateLayoutBuilderShell initialData={initialData} initialPreview={initialPreview} />
    </div>
  );
}
