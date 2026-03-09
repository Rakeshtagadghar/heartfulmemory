"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import type { AdminUserSummary } from "../../lib/admin/adminOps";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-500/15 text-green-400",
    pending_deletion: "bg-red-500/15 text-red-400",
    deleted: "bg-white/10 text-white/40",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${colors[status] ?? "bg-white/10 text-white/50"}`}>
      {status}
    </span>
  );
}

function OnboardingBadge({ completed }: { completed: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${completed ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"}`}>
      {completed ? "Done" : "Incomplete"}
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

export function AdminUsersSearch({
  initialQuery,
  users,
  total,
}: {
  initialQuery: string;
  users: AdminUserSummary[];
  total: number;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/admin/users${params.size ? `?${params}` : ""}`);
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="Search by email, name, or user ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white placeholder:text-white/30"
        />
        <button
          type="submit"
          className="cursor-pointer rounded-lg bg-white/[0.08] px-4 py-2 text-sm text-white transition hover:bg-white/[0.12]"
        >
          Search
        </button>
      </form>

      <p className="mt-3 text-xs text-white/40">
        {total} user{total !== 1 ? "s" : ""} found
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Onboarding</th>
              <th className="px-3 py-2">Projects</th>
              <th className="px-3 py-2">Last Active</th>
              <th className="px-3 py-2">Signed Up</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-white/30">
                  {initialQuery ? "No users match your search." : "No users found."}
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-3 py-3">
                  <Link href={`/admin/users/${user.id}`} className="text-white/80 hover:text-white hover:underline">
                    {user.displayName || "—"}
                  </Link>
                </td>
                <td className="px-3 py-3 text-xs text-white/60">{user.email ?? "—"}</td>
                <td className="px-3 py-3"><StatusBadge status={user.accountStatus} /></td>
                <td className="px-3 py-3"><OnboardingBadge completed={user.onboardingCompleted} /></td>
                <td className="px-3 py-3 text-center text-xs text-white/60">{user.projectCount}</td>
                <td className="px-3 py-3 text-xs text-white/40">{timeAgo(user.lastActivityAt)}</td>
                <td className="px-3 py-3 text-xs text-white/40">{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
