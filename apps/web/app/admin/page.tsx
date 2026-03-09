import { requireAdmin } from "../../lib/admin/requireAdmin";
import { getPermissionsForRole } from "../../../../packages/shared/admin/rbac";
import { PermissionGate } from "../../components/admin/PermissionGate";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const permissions = getPermissionsForRole(admin.role);

  return (
    <div>
      <h1 className="text-xl font-semibold">Admin Console</h1>
      <p className="mt-1 text-sm text-white/50">
        Signed in as <span className="text-white/70">{admin.email}</span> &middot;{" "}
        <span className="capitalize">{admin.role.replace(/_/g, " ")}</span>
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PermissionGate role={admin.role} permission="users.manage_admin_roles">
          <DashboardCard
            title="Admin Users"
            description="Manage admin access and roles"
            href="/admin/admin-users"
          />
        </PermissionGate>
        <PermissionGate role={admin.role} permission="audit_logs.view">
          <DashboardCard
            title="Audit Logs"
            description="View admin activity logs"
            href="/admin/audit-logs"
          />
        </PermissionGate>
        <PermissionGate role={admin.role} permission="users.view">
          <DashboardCard
            title="Users"
            description="Search and inspect user accounts"
            href="/admin/users"
          />
        </PermissionGate>
        <PermissionGate role={admin.role} permission="projects.view">
          <DashboardCard
            title="Projects"
            description="Inspect storybook projects"
            href="/admin/users"
          />
        </PermissionGate>
        <PermissionGate role={admin.role} permission="exports.view">
          <DashboardCard
            title="Exports"
            description="Monitor export pipeline"
            href="/admin/exports"
          />
        </PermissionGate>
        <PermissionGate role={admin.role} permission="templates.view">
          <DashboardCard
            title="Templates"
            description="Manage content templates"
            href="/admin"
            disabled
          />
        </PermissionGate>
      </div>

      <div className="mt-8 rounded-xl border border-white/8 bg-white/[0.02] p-4">
        <h2 className="text-sm font-medium text-white/60">Your Permissions</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {permissions.map((p) => (
            <span
              key={p}
              className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs text-white/50"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
  disabled = false,
}: {
  title: string;
  description: string;
  href: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4 opacity-50">
        <h3 className="text-sm font-medium text-white/60">{title}</h3>
        <p className="mt-1 text-xs text-white/35">{description}</p>
        <p className="mt-2 text-[10px] uppercase tracking-wider text-white/25">Coming soon</p>
      </div>
    );
  }

  return (
    <a
      href={href}
      className="block rounded-xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/15 hover:bg-white/[0.05]"
    >
      <h3 className="text-sm font-medium text-white/80">{title}</h3>
      <p className="mt-1 text-xs text-white/50">{description}</p>
    </a>
  );
}
