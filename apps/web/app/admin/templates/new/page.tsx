import Link from "next/link";
import { TemplateCreateCard } from "../../../../components/admin/TemplateCreateCard";
import { requireAdminWithPermission } from "../../../../lib/admin/requireAdmin";

export default async function AdminTemplateCreatePage() {
  await requireAdminWithPermission("templates.manage");

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <Link href="/admin/templates" className="text-xs text-white/40 hover:text-white/70">
          &larr; Back to Templates
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h1 className="text-2xl font-semibold text-white">Create Template</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/50">
          Create a new draft template record in the admin console. After creation, continue in the
          template detail page to edit questions, publish state, defaults, and usage rules.
        </p>
      </div>

      <div className="mt-6">
        <TemplateCreateCard />
      </div>
    </div>
  );
}
