"use client";

import { useState } from "react";
import type { AdminUserRecord } from "../../lib/admin/adminOps";

function RoleBadge({ role }: { role: string }) {
  const label = role.replace(/_/g, " ");
  const colors: Record<string, string> = {
    super_admin: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    support_admin: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    content_admin: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${colors[role] ?? "bg-white/10 text-white/70 border-white/20"}`}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
        active ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
      }`}
    >
      {status}
    </span>
  );
}

export function AdminUserTable({
  admins,
  currentAdminRole,
}: {
  admins: AdminUserRecord[];
  currentAdminRole: string;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState(admins);

  // Add admin form state
  const [showAdd, setShowAdd] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState("support_admin");

  const isSuperAdmin = currentAdminRole === "super_admin";

  async function handleUpdate(adminId: string, patch: { role?: string; status?: string }) {
    if (busy) return;
    setBusy(adminId);
    setError(null);

    try {
      const res = await fetch(`/api/admin/admin-users/${adminId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? "Update failed");
        return;
      }
      // Optimistic update
      setList((prev) =>
        prev.map((a) => (a.id === adminId ? { ...a, ...patch, updatedAt: Date.now() } : a))
      );
    } catch {
      setError("Network error");
    } finally {
      setBusy(null);
    }
  }

  async function handleAdd() {
    if (busy || !newUserId.trim()) return;
    setBusy("add");
    setError(null);

    try {
      const res = await fetch("/api/admin/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: newUserId.trim(), role: newRole }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? "Failed to add admin");
        return;
      }
      setList((prev) => [
        ...prev,
        {
          id: data.data.id,
          userId: newUserId.trim(),
          role: newRole,
          status: "active",
          createdBy: null,
          lastLoginAt: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);
      setNewUserId("");
      setShowAdd(false);
    } catch {
      setError("Network error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
            <th className="px-3 py-2">User ID</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Created</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map((admin) => (
            <tr key={admin.id} className="border-b border-white/5">
              <td className="px-3 py-3 font-mono text-xs text-white/60">{admin.userId}</td>
              <td className="px-3 py-3">
                <RoleBadge role={admin.role} />
              </td>
              <td className="px-3 py-3">
                <StatusBadge status={admin.status} />
              </td>
              <td className="px-3 py-3 text-xs text-white/40">
                {new Date(admin.createdAt).toLocaleDateString()}
              </td>
              <td className="px-3 py-3">
                {isSuperAdmin && (
                  <div className="flex gap-1">
                    {admin.status === "active" ? (
                      <button
                        type="button"
                        disabled={busy === admin.id}
                        className="cursor-pointer rounded px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                        onClick={() => {
                          if (confirm("Disable this admin? They will lose admin access immediately.")) {
                            void handleUpdate(admin.id, { status: "disabled" });
                          }
                        }}
                      >
                        Disable
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy === admin.id}
                        className="cursor-pointer rounded px-2 py-1 text-xs text-green-400 transition hover:bg-green-500/10 disabled:opacity-50"
                        onClick={() => void handleUpdate(admin.id, { status: "active" })}
                      >
                        Reactivate
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isSuperAdmin && (
        <div className="mt-4">
          {showAdd ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="text-sm font-medium text-white/70">Grant Admin Access</h3>
              <div className="mt-3 flex gap-3">
                <input
                  type="text"
                  placeholder="User ID (authSubject)"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  className="flex-1 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder:text-white/30"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="support_admin">Support Admin</option>
                  <option value="content_admin">Content Admin</option>
                </select>
                <button
                  type="button"
                  disabled={busy === "add" || !newUserId.trim()}
                  className="cursor-pointer rounded-lg bg-white/[0.08] px-4 py-2 text-sm text-white transition hover:bg-white/[0.12] disabled:opacity-50"
                  onClick={() => void handleAdd()}
                >
                  Add
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm text-white/50 transition hover:text-white/80"
                  onClick={() => setShowAdd(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="cursor-pointer rounded-lg bg-white/[0.06] px-4 py-2 text-sm text-white/70 transition hover:bg-white/[0.10] hover:text-white"
              onClick={() => setShowAdd(true)}
            >
              + Add Admin
            </button>
          )}
        </div>
      )}
    </div>
  );
}
