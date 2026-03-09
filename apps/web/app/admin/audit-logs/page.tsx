import { requireAdminWithPermission } from "../../../lib/admin/requireAdmin";
import { listAuditLogs } from "../../../lib/admin/adminOps";

export default async function AuditLogsPage() {
  await requireAdminWithPermission("audit_logs.view");
  const logs = await listAuditLogs({ limit: 100 });

  return (
    <div>
      <h1 className="text-xl font-semibold">Audit Logs</h1>
      <p className="mt-1 text-sm text-white/50">
        Recent admin activity and security events.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
              <th className="px-3 py-2">Timestamp</th>
              <th className="px-3 py-2">Event</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Resource</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-white/30">
                  No audit logs yet.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-white/5">
                <td className="whitespace-nowrap px-3 py-2 text-xs text-white/50">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs text-white/60">
                    {log.eventType}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-white/60">{log.action}</td>
                <td className="px-3 py-2 font-mono text-xs text-white/40">
                  {log.actorUserId ?? "—"}
                </td>
                <td className="px-3 py-2 text-xs text-white/40">
                  {log.resourceType ? `${log.resourceType}${log.resourceId ? `:${log.resourceId}` : ""}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
