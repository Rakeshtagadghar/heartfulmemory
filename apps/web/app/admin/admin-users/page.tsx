import { requireAdminWithPermission } from "../../../lib/admin/requireAdmin";
import { listAllAdminUsers } from "../../../lib/admin/adminOps";
import { AdminUserTable } from "../../../components/admin/AdminUserTable";

export default async function AdminUsersPage() {
  const admin = await requireAdminWithPermission("users.manage_admin_roles");
  const admins = await listAllAdminUsers();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Admin Users</h1>
          <p className="mt-1 text-sm text-white/50">
            Manage who has admin access and their roles.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <AdminUserTable admins={admins} currentAdminRole={admin.role} />
      </div>
    </div>
  );
}
