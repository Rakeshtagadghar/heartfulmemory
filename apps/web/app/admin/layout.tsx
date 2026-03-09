import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAdmin } from "../../lib/admin/requireAdmin";
import { AdminNav } from "../../components/admin/AdminNav";
import { noindexMetadata } from "../../lib/seo/metadata";
import { writeAuditLog } from "../../lib/admin/adminOps";

export const metadata: Metadata = {
  ...noindexMetadata,
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  // Audit: log page view (fire-and-forget)
  void writeAuditLog({
    adminUserId: admin.adminId,
    actorUserId: admin.userId,
    eventType: "admin_page_viewed",
    action: "access",
  });

  return (
    <div className="min-h-screen bg-[#0a1321] text-white">
      <AdminNav email={admin.email} role={admin.role} />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
