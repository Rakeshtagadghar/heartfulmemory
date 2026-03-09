"use client";

import type { ReactNode } from "react";
import type { AdminPermission } from "../../../../packages/shared/admin/rbac";
import { hasPermission } from "../../../../packages/shared/admin/rbac";

export function PermissionGate({
  role,
  permission,
  children,
  fallback = null,
}: {
  role: string;
  permission: AdminPermission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  if (!hasPermission(role, permission)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
