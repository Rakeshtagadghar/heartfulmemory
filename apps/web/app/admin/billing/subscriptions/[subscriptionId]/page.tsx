import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSubscriptionDetail, writeAuditLog } from "../../../../../lib/admin/adminOps";
import { requireAdminWithPermission } from "../../../../../lib/admin/requireAdmin";

function formatDateTime(value: number | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function formatStatusLabel(value: string | null) {
  if (!value) return "-";
  return value.replaceAll("_", " ");
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean | null;
}) {
  let rendered = "-";
  if (typeof value === "boolean") rendered = value ? "Yes" : "No";
  else if (value !== null) rendered = String(value);

  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-white/40">{label}</span>
      <span className="text-right text-white/75">{rendered}</span>
    </div>
  );
}

export default async function AdminSubscriptionDetailPage({
  params,
}: {
  params: Promise<{ subscriptionId: string }>;
}) {
  const admin = await requireAdminWithPermission("billing.view");
  const { subscriptionId: rawSubscriptionId } = await params;
  const subscriptionId = decodeURIComponent(rawSubscriptionId);
  const subscription = await getAdminSubscriptionDetail(subscriptionId);

  if (!subscription) {
    redirect("/admin/users");
  }

  void writeAuditLog({
    adminUserId: admin.adminId,
    actorUserId: admin.userId,
    eventType: "admin_subscription_viewed",
    resourceType: "subscription",
    resourceId: subscriptionId,
    action: "view",
    metadataJson: {
      userId: subscription.userId,
      planCode: subscription.planCode,
      status: subscription.status,
      mode: subscription.mode,
    },
  });

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/users/${encodeURIComponent(subscription.userId)}/billing`}
          className="text-xs text-white/40 hover:text-white/70"
        >
          &larr; Back to User Billing
        </Link>
        <h1 className="mt-3 text-xl font-semibold text-white/90">Subscription Detail</h1>
        <p className="mt-1 text-sm text-white/50">
          {subscription.userDisplayName ?? "Unnamed User"}
          {" - "}
          {subscription.userEmail ?? subscription.userId}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/35">Subscription</p>
          <h2 className="mt-2 text-lg font-semibold text-white/90">{subscription.planLabel}</h2>
          <p className="mt-1 text-sm text-white/45">{formatStatusLabel(subscription.status)}</p>

          <div className="mt-4 divide-y divide-white/5">
            <InfoRow label="Plan code" value={subscription.planCode} />
            <InfoRow label="Mode" value={subscription.mode} />
            <InfoRow label="Customer ref" value={subscription.providerCustomerRefMasked} />
            <InfoRow label="Subscription ref" value={subscription.providerSubscriptionRefMasked} />
            <InfoRow label="Current period start" value={formatDateTime(subscription.currentPeriodStart)} />
            <InfoRow label="Current period end" value={formatDateTime(subscription.currentPeriodEnd)} />
            <InfoRow label="Cancel at period end" value={subscription.cancelAtPeriodEnd} />
            <InfoRow label="Last synced" value={formatDateTime(subscription.lastSyncedAt)} />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-medium text-white/75">Payment summary</h2>
            <div className="mt-3 divide-y divide-white/5">
              <InfoRow label="Latest payment status" value={formatStatusLabel(subscription.latestPaymentStatus)} />
              <InfoRow label="Latest invoice" value={subscription.latestInvoiceIdMasked} />
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-medium text-white/75">Entitlement projection</h2>
            <div className="mt-3 divide-y divide-white/5">
              <InfoRow label="Entitlement status" value={formatStatusLabel(subscription.entitlementProjection.status)} />
              <InfoRow label="Digital export access" value={subscription.entitlementProjection.canExportDigital} />
              <InfoRow label="Hardcopy export access" value={subscription.entitlementProjection.canExportHardcopy} />
              <InfoRow label="Exports remaining" value={subscription.entitlementProjection.exportsRemaining} />
              <InfoRow label="Manual override" value={subscription.manualOverrideState?.active ?? false} />
              <InfoRow label="Override expiry" value={formatDateTime(subscription.manualOverrideState?.expiresAt ?? null)} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
