import { requireAdminWithPermission } from "../../../lib/admin/requireAdmin";
import { searchUsers } from "../../../lib/admin/adminOps";
import { AdminUsersSearch } from "../../../components/admin/AdminUsersSearch";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminWithPermission("users.view");
  const { q } = await searchParams;
  const result = await searchUsers(q, 50);

  return (
    <div>
      <h1 className="text-xl font-semibold">Users</h1>
      <p className="mt-1 text-sm text-white/50">
        Search and inspect Memorioso user accounts.
      </p>

      <div className="mt-6">
        <AdminUsersSearch initialQuery={q ?? ""} users={result.items} total={result.total} />
      </div>
    </div>
  );
}
