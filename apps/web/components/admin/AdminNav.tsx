"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { AdminPermission } from "../../../../packages/shared/admin/rbac";
import { hasPermission } from "../../../../packages/shared/admin/rbac";

interface NavItem {
  label: string;
  href: string;
  permission: AdminPermission;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", permission: "dashboard.view" },
  { label: "Users", href: "/admin/users", permission: "users.view" },
  { label: "Exports", href: "/admin/exports", permission: "exports.view" },
  { label: "Admin Users", href: "/admin/admin-users", permission: "users.manage_admin_roles" },
  { label: "Audit Logs", href: "/admin/audit-logs", permission: "audit_logs.view" },
];

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

export function AdminNav({
  email,
  role,
}: {
  email: string;
  role: string;
}) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(role, item.permission));

  return (
    <nav className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2 sm:px-6">
      <div className="flex items-center gap-1">
        <Link
          href="/app"
          className="mr-3 rounded-lg px-2 py-1 text-xs text-white/50 transition hover:bg-white/[0.05] hover:text-white/80"
        >
          &larr; App
        </Link>
        <span className="mr-3 rounded-md bg-rose-500/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-300">
          Admin
        </span>
        {visibleItems.map((item) => {
          const active = item.href === "/admin"
            ? pathname === "/admin"
            : pathname?.startsWith(item.href) ?? false;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "rounded-lg px-3 py-1.5 text-sm transition",
                active
                  ? "bg-white/[0.08] text-white"
                  : "text-white/60 hover:bg-white/[0.05] hover:text-white/90",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <RoleBadge role={role} />
        <span className="text-xs text-white/50">{email}</span>
        <button
          type="button"
          className="cursor-pointer rounded-lg px-2 py-1 text-xs text-white/50 transition hover:bg-white/[0.05] hover:text-white/80"
          onClick={() => void signOut({ callbackUrl: "/auth/sign-in?loggedOut=1" })}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
