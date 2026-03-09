import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { hasPermission } from "../../../../../../../packages/shared/admin/rbac";
import { BillingResyncActionCard } from "../../../../../components/admin/BillingResyncActionCard";
import { ManualEntitlementActionCard } from "../../../../../components/admin/ManualEntitlementActionCard";
import {
  getAdminUserBillingDetail,
  listAuditLogsForResource,
  writeAuditLog,
} from "../../../../../lib/admin/adminOps";
import { requireAdminWithPermission } from "../../../../../lib/admin/requireAdmin";
import type { AdminBillingDetail } from "../../../../../../../packages/shared/admin/billingSupport";

function formatDateTime(value: number | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function formatStatusLabel(value: string | null) {
  if (!value) return "-";
  return value.replaceAll("_", " ");
}

function StatusBadge({
  value,
  tone = "neutral",
}: {
  value: string;
  tone?: "neutral" | "good" | "warning" | "danger";
}) {
  const toneClass =
    tone === "good"
      ? "bg-emerald-500/15 text-emerald-300"
      : tone === "warning"
        ? "bg-amber-500/15 text-amber-300"
        : tone === "danger"
          ? "bg-rose-500/15 text-rose-300"
          : "bg-white/10 text-white/70";

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs capitalize ${toneClass}`}>
      {formatStatusLabel(value)}
    </span>
  );
}

function entitlementTone(status: AdminBillingDetail["entitlements"]["status"]) {
  if (status === "active" || status === "trial_active" || status === "manually_granted") {
    return "good" as const;
  }
  if (status === "grace_period") return "warning" as const;
  if (status === "expired" || status === "suspended") return "danger" as const;
  return "neutral" as const;
}

function subscriptionTone(status: string) {
  if (status === "active" || status === "trialing") return "good" as const;
  if (status === "past_due" || status === "incomplete") return "warning" as const;
  if (status === "canceled" || status === "unpaid") return "danger" as const;
  return "neutral" as const;
}

function paymentTone(status: AdminBillingDetail["paymentAttemptSummary"]["status"]) {
  if (status === "succeeded") return "good" as const;
  if (status === "pending" || status === "requires_action") return "warning" as const;
  if (status === "failed" || status === "cancelled") return "danger" as const;
  return "neutral" as const;
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean | null;
}) {
  let rendered: string;
  if (typeof value === "boolean") {
    rendered = value ? "Yes" : "No";
  } else {
    rendered = value === null ? "-" : String(value);
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-white/40">{label}</span>
      <span className="text-right text-white/75">{rendered}</span>
    </div>
  );
}

function SummaryCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">{label}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default async function AdminUserBillingPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const admin = await requireAdminWithPermission("billing.view");
  const { userId: rawUserId } = await params;
  const userId = decodeURIComponent(rawUserId);
  const billing = await getAdminUserBillingDetail(userId);
  const canManageBilling = hasPermission(admin.role, "billing.support_action");
  const billingActivity = (await listAuditLogsForResource("user", userId, 12)).filter((item) =>
    item.eventType.startsWith("admin_billing") ||
    item.eventType.startsWith("admin_manual_entitlement")
  );

  if (!billing) {
    redirect(`/admin/users/${encodeURIComponent(userId)}`);
  }

  void writeAuditLog({
    adminUserId: admin.adminId,
    actorUserId: admin.userId,
    eventType: "admin_billing_viewed",
    resourceType: "user",
    resourceId: userId,
    action: "view",
    metadataJson: {
      planCode: billing.planSummary.planCode,
      entitlementStatus: billing.entitlements.status,
      subscriptionStatus: billing.subscriptionSummary.status,
      billingMode: billing.sandboxOrLiveStatus,
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <Link
            href={`/admin/users/${encodeURIComponent(userId)}`}
            className="text-xs text-white/40 hover:text-white/70"
          >
            &larr; Back to User
          </Link>
          <h1 className="mt-3 text-xl font-semibold text-white/90">User Billing</h1>
          <p className="mt-1 text-sm text-white/50">
            {billing.userSummary.displayName ?? "Unnamed User"}
            {" · "}
            {billing.userSummary.email ?? billing.userSummary.userId}
          </p>
        </div>
        <StatusBadge
          value={billing.sandboxOrLiveStatus}
          tone={billing.sandboxOrLiveStatus === "live" ? "good" : "warning"}
        />
      </div>

      <div
        className={`mb-6 rounded-xl border p-4 ${
          billing.sandboxOrLiveStatus === "live"
            ? "border-emerald-500/20 bg-emerald-500/10"
            : billing.sandboxOrLiveStatus === "sandbox"
              ? "border-amber-500/20 bg-amber-500/10"
              : "border-white/10 bg-white/[0.03]"
        }`}
      >
        <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Billing mode</p>
        <p className="mt-2 text-sm text-white/85">
          {billing.sandboxOrLiveStatus === "sandbox"
            ? "This environment is in sandbox/test billing mode."
            : billing.sandboxOrLiveStatus === "live"
              ? "This environment is in live billing mode."
              : "Billing mode could not be determined from runtime configuration."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Plan">
          <p className="text-lg font-semibold text-white">{billing.planSummary.planLabel}</p>
          <p className="mt-1 text-sm text-white/45">{billing.planSummary.planCode}</p>
        </SummaryCard>
        <SummaryCard label="Entitlement">
          <StatusBadge value={billing.entitlements.status} tone={entitlementTone(billing.entitlements.status)} />
          <p className="mt-3 text-sm text-white/55">
            Digital export {billing.entitlements.canExportDigital ? "enabled" : "disabled"}
          </p>
        </SummaryCard>
        <SummaryCard label="Subscription">
          <StatusBadge
            value={billing.subscriptionSummary.status}
            tone={subscriptionTone(billing.subscriptionSummary.status)}
          />
          <p className="mt-3 text-sm text-white/55">
            Payment attempt{" "}
            <span className="inline-block">
              <StatusBadge
                value={billing.paymentAttemptSummary.status}
                tone={paymentTone(billing.paymentAttemptSummary.status)}
              />
            </span>
          </p>
        </SummaryCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-medium text-white/75">Support diagnosis</h2>
            {billing.recommendedSupportDiagnosis ? (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-sm font-medium text-white/85">
                  {billing.recommendedSupportDiagnosis.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  {billing.recommendedSupportDiagnosis.message}
                </p>
                {billing.recommendedSupportDiagnosis.nextStep ? (
                  <p className="mt-3 text-xs uppercase tracking-[0.14em] text-white/35">
                    Next step: {billing.recommendedSupportDiagnosis.nextStep}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-white/45">
                No immediate billing diagnosis rule matched this account.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-medium text-white/75">Plan and entitlements</h2>
            <div className="mt-3 divide-y divide-white/5">
              <InfoRow label="Plan label" value={billing.planSummary.planLabel} />
              <InfoRow label="Plan code" value={billing.planSummary.planCode} />
              <InfoRow label="Entitlement status" value={formatStatusLabel(billing.entitlements.status)} />
              <InfoRow label="Digital export access" value={billing.entitlements.canExportDigital} />
              <InfoRow label="Hardcopy export access" value={billing.entitlements.canExportHardcopy} />
              <InfoRow label="Exports remaining" value={billing.entitlements.exportsRemaining} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {billing.planSummary.features.map((feature) => (
                <span
                  key={feature}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-white/55"
                >
                  {feature}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-medium text-white/75">Recent billing activity</h2>
            {billingActivity.length === 0 ? (
              <p className="mt-3 text-sm text-white/45">
                No recent billing support activity is recorded for this user.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {billingActivity.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/8 bg-white/[0.02] p-3"
                  >
                    <p className="text-xs uppercase tracking-[0.14em] text-white/35">
                      {item.eventType.replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 text-sm text-white/65">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-medium text-white/75">Subscription summary</h2>
            <div className="mt-3 divide-y divide-white/5">
              <InfoRow label="Subscription status" value={formatStatusLabel(billing.subscriptionSummary.status)} />
              <InfoRow label="Customer ref" value={billing.subscriptionSummary.providerCustomerRefMasked} />
              <InfoRow
                label="Subscription ref"
                value={billing.subscriptionSummary.providerSubscriptionRefMasked}
              />
              <InfoRow
                label="Current period start"
                value={formatDateTime(billing.subscriptionSummary.currentPeriodStart)}
              />
              <InfoRow
                label="Current period end"
                value={formatDateTime(billing.subscriptionSummary.currentPeriodEnd)}
              />
              <InfoRow
                label="Cancel at period end"
                value={billing.subscriptionSummary.cancelAtPeriodEnd}
              />
              <InfoRow label="Last updated" value={formatDateTime(billing.subscriptionSummary.updatedAt)} />
            </div>
            {billing.subscriptionSummary.id ? (
              <Link
                href={`/admin/billing/subscriptions/${encodeURIComponent(billing.subscriptionSummary.id)}`}
                className="mt-4 inline-flex text-sm text-white/65 hover:text-white"
              >
                Open subscription detail
              </Link>
            ) : null}
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-medium text-white/75">Checkout and payment</h2>
            <div className="mt-3 divide-y divide-white/5">
              <InfoRow
                label="Last checkout"
                value={billing.checkoutHistorySummary.lastCheckoutStatus}
              />
              <InfoRow
                label="Last billing event"
                value={formatDateTime(billing.checkoutHistorySummary.lastBillingEventAt)}
              />
              <InfoRow
                label="Payment attempt"
                value={formatStatusLabel(billing.paymentAttemptSummary.status)}
              />
              <InfoRow
                label="Latest invoice"
                value={billing.paymentAttemptSummary.latestInvoiceIdMasked}
              />
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-medium text-white/75">Support flags</h2>
            <div className="mt-3 divide-y divide-white/5">
              <InfoRow label="Customer record" value={billing.supportFlags.hasCustomerRecord} />
              <InfoRow label="Subscription record" value={billing.supportFlags.hasSubscriptionRecord} />
              <InfoRow label="Needs recovery" value={billing.supportFlags.needsRecovery} />
              <InfoRow
                label="Manual override"
                value={billing.manualOverrideState?.active ?? false}
              />
              <InfoRow
                label="Override expiry"
                value={formatDateTime(billing.manualOverrideState?.expiresAt ?? null)}
              />
            </div>
          </section>

          {canManageBilling ? (
            <>
              <BillingResyncActionCard userId={userId} />
              <ManualEntitlementActionCard userId={userId} />
            </>
          ) : (
            <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-sm font-medium text-white/75">Support actions</h2>
              <p className="mt-3 text-sm text-white/45">
                Your role can view billing state but cannot perform support actions.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
