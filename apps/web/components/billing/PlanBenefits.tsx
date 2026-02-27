"use client";

export function PlanBenefits({ className }: { className?: string }) {
  const listClassName =
    className ??
    "mt-5 space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/80";

  return (
    <ul className={listClassName}>
      <li>GBP 30/month</li>
      <li>100 PDF exports per month</li>
      <li>Digital + hardcopy-ready export modes</li>
      <li>Manage plan and invoices in Stripe portal</li>
    </ul>
  );
}
