import { queryGeneric } from "convex/server";
import { v } from "convex/values";
import {
  calculateDelta,
  calculatePercentage,
  findLargestDropoffStageId,
  type AdminDashboardSummaryData,
} from "../packages/shared/admin/dashboard";
import {
  classifyAdminExportFailure,
  createAdminExportRecordId,
} from "../packages/shared/admin/exportMonitoring";

type UserRow = {
  authSubject: string;
  email?: string | null;
  primaryEmail?: string | null;
  display_name?: string | null;
  deletionStatus?: "active" | "pending_deletion" | "deleted" | null;
  onboarding_completed: boolean;
  lastActivityAt?: number | null;
  createdAt: number;
};

type StorybookRow = {
  _id: string;
  ownerId: string;
  title: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "DELETED";
  flowStatus?:
    | "needs_questions"
    | "needs_extra_question"
    | "needs_upload_photos"
    | "populating"
    | "ready_in_studio"
    | "error"
    | null;
  createdAt: number;
};

type ExportJobRow = {
  _id: string;
  userId: string;
  storybookId: string;
  triggerSource?: "user" | "admin_retry";
  status: "queued" | "running" | "done" | "error";
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt: number;
};

type ExportAttemptRow = {
  _id: string;
  storybookId: string;
  ownerId: string;
  exportHash: string;
  status: "SUCCESS" | "FAILED";
  errorSummary?: string | null;
  createdAt: number;
};

type BillingSubscriptionRow = {
  userId: string;
  planId: string;
  status: "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "incomplete";
  updatedAt: number;
};

type BillingManualEntitlementRow = {
  userId: string;
  entitlementStatus: "manually_granted" | "suspended";
  expiresAt?: number | null;
  revokedAt?: number | null;
  createdAt: number;
};

type WaitlistRow = {
  createdAt: number;
};

function isNonDeletedUser(user: UserRow) {
  return user.deletionStatus !== "deleted";
}

function inRange(value: number | null | undefined, dateFrom: number, dateTo: number) {
  return typeof value === "number" && value >= dateFrom && value <= dateTo;
}

function latestByUser<T extends { userId: string; updatedAt?: number; createdAt?: number }>(
  rows: T[]
) {
  const map = new Map<string, T>();
  for (const row of rows) {
    const existing = map.get(row.userId);
    const currentTime = row.updatedAt ?? row.createdAt ?? 0;
    const existingTime = existing ? existing.updatedAt ?? existing.createdAt ?? 0 : -1;
    if (!existing || currentTime > existingTime) {
      map.set(row.userId, row);
    }
  }
  return map;
}

function isActiveManualOverride(row: BillingManualEntitlementRow | undefined, nowMs: number) {
  if (!row) return false;
  if (row.revokedAt) return false;
  if (row.expiresAt && row.expiresAt <= nowMs) return false;
  return row.entitlementStatus === "manually_granted";
}

function classifyStorybookState(input: {
  storybook: StorybookRow;
  hasSuccessfulExport: boolean;
}): "draft" | "in_progress" | "export_ready" | "exported" | "failed_state" {
  if (input.hasSuccessfulExport) return "exported";
  if (input.storybook.flowStatus === "error") return "failed_state";
  if (
    input.storybook.flowStatus === "ready_in_studio" ||
    input.storybook.status === "ACTIVE" ||
    input.storybook.status === "ARCHIVED"
  ) {
    return "export_ready";
  }
  if (input.storybook.flowStatus && input.storybook.flowStatus !== "needs_questions") {
    return "in_progress";
  }
  return "draft";
}

function toBreakdownItems(values: Record<string, number>) {
  const total = Object.values(values).reduce((sum, count) => sum + count, 0);
  return Object.entries(values).map(([id, count]) => ({
    id,
    label: id.replaceAll("_", " "),
    count,
    percentage: calculatePercentage(count, total),
  }));
}

function buildAlerts(input: {
  exportFailureRate: number;
  failedExportsCount: number;
  manualEntitlementCount: number;
  errorsAvailable: boolean;
}) {
  const items: AdminDashboardSummaryData["recentAlerts"]["items"] = [];

  if (input.failedExportsCount >= 3 || input.exportFailureRate >= 20) {
    items.push({
      id: "export_failure_rate",
      level: input.exportFailureRate >= 40 ? "critical" : "warning",
      title: "Export reliability needs attention",
      message: `Failure rate is ${input.exportFailureRate.toFixed(1)}% across recent completed exports.`,
      href: "/admin/exports?status=failed",
      occurredAt: Date.now(),
    });
  }

  if (input.manualEntitlementCount > 0) {
    items.push({
      id: "manual_entitlements_active",
      level: "info",
      title: "Manual billing overrides are active",
      message: `${input.manualEntitlementCount} users currently have temporary manual billing access.`,
      href: "/admin/users",
      occurredAt: Date.now(),
    });
  }

  if (!input.errorsAvailable) {
    items.push({
      id: "error_source_unavailable",
      level: "info",
      title: "Error source unavailable",
      message: "Application error aggregation is not configured yet; the errors widget is in unavailable state.",
      href: null,
      occurredAt: Date.now(),
    });
  }

  return items.slice(0, 5);
}

export const getDashboardSummaryCore = queryGeneric({
  args: {
    dateFrom: v.number(),
    dateTo: v.number(),
    previousDateFrom: v.number(),
    previousDateTo: v.number(),
    includeBillingSnapshot: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<AdminDashboardSummaryData> => {
    const [
      users,
      storybooks,
      exportJobs,
      exportAttempts,
      waitlistEntries,
      billingSubscriptions,
      manualEntitlements,
    ] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("storybooks").collect(),
      ctx.db.query("exportJobs").collect(),
      ctx.db.query("exports").collect(),
      ctx.db.query("waitlist").collect(),
      args.includeBillingSnapshot ? ctx.db.query("billingSubscriptions").collect() : Promise.resolve([]),
      args.includeBillingSnapshot ? ctx.db.query("billingManualEntitlements").collect() : Promise.resolve([]),
    ]);

    const safeUsers = (users as UserRow[]).filter(isNonDeletedUser);
    const activeUsersInRange = safeUsers.filter((user) =>
      inRange(user.lastActivityAt ?? null, args.dateFrom, args.dateTo)
    );
    const activeUsersPrevious = safeUsers.filter((user) =>
      inRange(user.lastActivityAt ?? null, args.previousDateFrom, args.previousDateTo)
    );
    const newUsersInRange = safeUsers.filter((user) =>
      inRange(user.createdAt, args.dateFrom, args.dateTo)
    );
    const newUsersPrevious = safeUsers.filter((user) =>
      inRange(user.createdAt, args.previousDateFrom, args.previousDateTo)
    );

    const liveStorybooks = (storybooks as StorybookRow[]).filter(
      (storybook) => storybook.status !== "DELETED"
    );
    const booksCreatedInRange = liveStorybooks.filter((storybook) =>
      inRange(storybook.createdAt, args.dateFrom, args.dateTo)
    );
    const booksCreatedPrevious = liveStorybooks.filter((storybook) =>
      inRange(storybook.createdAt, args.previousDateFrom, args.previousDateTo)
    );

    const jobIdSet = new Set((exportJobs as ExportJobRow[]).map((job) => job._id));
    const standaloneAttempts = (exportAttempts as ExportAttemptRow[]).filter(
      (attempt) => !jobIdSet.has(attempt.exportHash)
    );

    const completedJobsInRange = (exportJobs as ExportJobRow[]).filter(
      (job) =>
        inRange(job.createdAt, args.dateFrom, args.dateTo) &&
        (job.status === "done" || job.status === "error")
    );
    const completedJobsPrevious = (exportJobs as ExportJobRow[]).filter(
      (job) =>
        inRange(job.createdAt, args.previousDateFrom, args.previousDateTo) &&
        (job.status === "done" || job.status === "error")
    );
    const completedAttemptsInRange = standaloneAttempts.filter((attempt) =>
      inRange(attempt.createdAt, args.dateFrom, args.dateTo)
    );
    const completedAttemptsPrevious = standaloneAttempts.filter((attempt) =>
      inRange(attempt.createdAt, args.previousDateFrom, args.previousDateTo)
    );

    const successCountInRange =
      completedJobsInRange.filter((job) => job.status === "done").length +
      completedAttemptsInRange.filter((attempt) => attempt.status === "SUCCESS").length;
    const failureCountInRange =
      completedJobsInRange.filter((job) => job.status === "error").length +
      completedAttemptsInRange.filter((attempt) => attempt.status === "FAILED").length;
    const successCountPrevious =
      completedJobsPrevious.filter((job) => job.status === "done").length +
      completedAttemptsPrevious.filter((attempt) => attempt.status === "SUCCESS").length;
    const failureCountPrevious =
      completedJobsPrevious.filter((job) => job.status === "error").length +
      completedAttemptsPrevious.filter((attempt) => attempt.status === "FAILED").length;

    const exportSuccessRate = calculatePercentage(
      successCountInRange,
      successCountInRange + failureCountInRange
    );
    const exportSuccessRatePrevious = calculatePercentage(
      successCountPrevious,
      successCountPrevious + failureCountPrevious
    );

    const successfulProjectIds = new Set<string>([
      ...(exportJobs as ExportJobRow[])
        .filter((job) => job.status === "done")
        .map((job) => job.storybookId),
      ...standaloneAttempts
        .filter((attempt) => attempt.status === "SUCCESS")
        .map((attempt) => attempt.storybookId),
    ]);

    const bookStatusCounts = {
      draft: 0,
      in_progress: 0,
      export_ready: 0,
      exported: 0,
      failed_state: 0,
    };
    for (const storybook of liveStorybooks) {
      const state = classifyStorybookState({
        storybook,
        hasSuccessfulExport: successfulProjectIds.has(storybook._id),
      });
      bookStatusCounts[state] += 1;
    }

    const exportStatusCounts = {
      queued: (exportJobs as ExportJobRow[]).filter(
        (job) =>
          inRange(job.createdAt, args.dateFrom, args.dateTo) &&
          job.triggerSource !== "admin_retry" &&
          job.status === "queued"
      ).length,
      processing: (exportJobs as ExportJobRow[]).filter(
        (job) =>
          inRange(job.createdAt, args.dateFrom, args.dateTo) &&
          job.triggerSource !== "admin_retry" &&
          job.status === "running"
      ).length,
      succeeded: successCountInRange,
      failed: failureCountInRange,
      retry_queued: (exportJobs as ExportJobRow[]).filter(
        (job) =>
          inRange(job.createdAt, args.dateFrom, args.dateTo) &&
          job.triggerSource === "admin_retry" &&
          (job.status === "queued" || job.status === "running")
      ).length,
    };

    const userById = new Map(safeUsers.map((user) => [user.authSubject, user]));
    const projectById = new Map(liveStorybooks.map((storybook) => [storybook._id, storybook]));

    const failedExportItems = [
      ...(exportJobs as ExportJobRow[])
        .filter((job) => job.status === "error")
        .map((job) => ({
          id: createAdminExportRecordId("job", job._id),
          projectId: job.storybookId,
          ownerId: job.userId,
          failureCategory: classifyAdminExportFailure({
            status: "failed",
            errorCode: job.errorCode ?? null,
            errorMessage: job.errorMessage ?? null,
          }),
          createdAt: job.createdAt,
          href: `/admin/exports/${createAdminExportRecordId("job", job._id)}`,
        })),
      ...standaloneAttempts
        .filter((attempt) => attempt.status === "FAILED")
        .map((attempt) => ({
          id: createAdminExportRecordId("attempt", attempt._id),
          projectId: attempt.storybookId,
          ownerId: attempt.ownerId,
          failureCategory: classifyAdminExportFailure({
            status: "failed",
            errorCode: "EXPORT_ATTEMPT_FAILED",
            errorMessage: attempt.errorSummary ?? null,
          }),
          createdAt: attempt.createdAt,
          href: `/admin/exports/${createAdminExportRecordId("attempt", attempt._id)}`,
        })),
    ]
      .filter((item) => inRange(item.createdAt, args.dateFrom, args.dateTo))
      .sort((left, right) => right.createdAt - left.createdAt)
      .slice(0, 6)
      .map((item) => ({
        ...item,
        projectTitle: projectById.get(item.projectId)?.title ?? "Untitled project",
        ownerDisplayName: userById.get(item.ownerId)?.display_name ?? null,
        ownerEmail: userById.get(item.ownerId)?.primaryEmail ?? userById.get(item.ownerId)?.email ?? null,
      }));

    const latestSubscriptions = latestByUser(billingSubscriptions as BillingSubscriptionRow[]);
    const latestManualOverrides = latestByUser(
      manualEntitlements as Array<BillingManualEntitlementRow & { updatedAt?: number }>
    );
    const manualEntitlementCount = safeUsers.filter((user) =>
      isActiveManualOverride(latestManualOverrides.get(user.authSubject), args.dateTo)
    ).length;

    const billingPlanSnapshot = args.includeBillingSnapshot
      ? {
          items: toBreakdownItems(
            safeUsers.reduce(
              (acc, user) => {
                const manualOverride = latestManualOverrides.get(user.authSubject);
                const subscription = latestSubscriptions.get(user.authSubject);
                if (isActiveManualOverride(manualOverride, args.dateTo)) {
                  acc.manual_entitlement += 1;
                } else if (subscription?.status === "trialing") {
                  acc.trial += 1;
                } else if (
                  subscription?.planId === "pro" &&
                  ["active", "past_due", "unpaid"].includes(subscription.status)
                ) {
                  acc.paid += 1;
                } else {
                  acc.free += 1;
                }
                return acc;
              },
              { free: 0, trial: 0, paid: 0, manual_entitlement: 0 }
            )
          ),
        }
      : null;

    const recentSignups = newUsersInRange
      .slice()
      .sort((left, right) => right.createdAt - left.createdAt)
      .slice(0, 6)
      .map((user) => {
        const manualOverride = latestManualOverrides.get(user.authSubject);
        const subscription = latestSubscriptions.get(user.authSubject);
        let planLabel = "Free";
        if (isActiveManualOverride(manualOverride, args.dateTo)) {
          planLabel = "Manual";
        } else if (subscription?.status === "trialing") {
          planLabel = "Trial";
        } else if (
          subscription?.planId === "pro" &&
          ["active", "past_due", "unpaid"].includes(subscription.status)
        ) {
          planLabel = "Pro";
        }

        return {
          userId: user.authSubject,
          displayName: user.display_name ?? null,
          email: user.primaryEmail ?? user.email ?? null,
          createdAt: user.createdAt,
          planLabel,
          onboardingStatus: user.onboarding_completed ? ("completed" as const) : ("incomplete" as const),
          href: `/admin/users/${encodeURIComponent(user.authSubject)}`,
        };
      });

    const signupUserIds = new Set(newUsersInRange.map((user) => user.authSubject));
    const firstLoginUserIds = new Set(
      newUsersInRange
        .filter((user) => typeof user.lastActivityAt === "number")
        .map((user) => user.authSubject)
    );
    const booksStartedBySignupUsers = new Set(
      booksCreatedInRange
        .filter((storybook) => firstLoginUserIds.has(storybook.ownerId))
        .map((storybook) => storybook.ownerId)
    );
    const exportReadyUserIds = new Set(
      booksCreatedInRange
        .filter((storybook) => booksStartedBySignupUsers.has(storybook.ownerId))
        .filter(
          (storybook) =>
            storybook.flowStatus === "ready_in_studio" ||
            storybook.status === "ACTIVE" ||
            storybook.status === "ARCHIVED"
        )
        .map((storybook) => storybook.ownerId)
    );
    const successfulExportUserIds = new Set(
      [
        ...(exportJobs as ExportJobRow[])
          .filter(
            (job) =>
              inRange(job.createdAt, args.dateFrom, args.dateTo) &&
              job.status === "done" &&
              exportReadyUserIds.has(job.userId)
          )
          .map((job) => job.userId),
        ...standaloneAttempts
          .filter(
            (attempt) =>
              inRange(attempt.createdAt, args.dateFrom, args.dateTo) &&
              attempt.status === "SUCCESS" &&
              exportReadyUserIds.has(attempt.ownerId)
          )
          .map((attempt) => attempt.ownerId),
      ]
    );
    const waitlistCount = (waitlistEntries as WaitlistRow[]).filter((entry) =>
      inRange(entry.createdAt, args.dateFrom, args.dateTo)
    ).length;

    const funnelStages = [
      {
        id: "landing_page_view",
        label: "Landing interest",
        count: Math.max(waitlistCount, signupUserIds.size),
      },
      {
        id: "signup_started_or_completed",
        label: "Signups",
        count: signupUserIds.size,
      },
      {
        id: "first_login",
        label: "First login",
        count: firstLoginUserIds.size,
      },
      {
        id: "book_started",
        label: "Book started",
        count: booksStartedBySignupUsers.size,
      },
      {
        id: "book_completed_or_export_ready",
        label: "Export ready",
        count: exportReadyUserIds.size,
      },
      {
        id: "pdf_generated",
        label: "PDF generated",
        count: successfulExportUserIds.size,
      },
    ].map((stage, index, stages) => {
      const previous = index > 0 ? stages[index - 1] : null;
      const conversionFromPrevious = previous
        ? calculatePercentage(stage.count, Math.max(previous.count, 1))
        : null;
      const dropFromPrevious = previous ? previous.count - stage.count : null;
      return {
        ...stage,
        conversionFromPrevious,
        dropFromPrevious,
      };
    });

    const recentErrors: AdminDashboardSummaryData["recentErrors"] = {
      available: false,
      reason: "Application error aggregation is not configured yet.",
      count: 0,
      affectedUsers: null,
      topCategories: [],
      latestItems: [],
    };

    return {
      kpis: {
        totalUsers: {
          value: safeUsers.length,
          unit: "count",
          delta: calculateDelta(newUsersInRange.length, newUsersPrevious.length),
          deltaLabel: "new users vs previous period",
          secondaryValue: newUsersInRange.length,
          secondaryLabel: "new in selected range",
        },
        activeUsers: {
          value: activeUsersInRange.length,
          unit: "count",
          delta: calculateDelta(activeUsersInRange.length, activeUsersPrevious.length),
          deltaLabel: "active users vs previous period",
          secondaryValue: Math.round(
            calculatePercentage(activeUsersInRange.length, Math.max(safeUsers.length, 1))
          ),
          secondaryLabel: "activity rate",
        },
        booksCreated: {
          value: liveStorybooks.length,
          unit: "count",
          delta: calculateDelta(booksCreatedInRange.length, booksCreatedPrevious.length),
          deltaLabel: "new books vs previous period",
          secondaryValue: booksCreatedInRange.length,
          secondaryLabel: "created in selected range",
        },
        exportSuccessRate: {
          value: exportSuccessRate,
          unit: "percentage",
          delta: calculateDelta(exportSuccessRate, exportSuccessRatePrevious),
          deltaLabel: "success rate vs previous period",
          secondaryValue: successCountInRange,
          secondaryLabel: "successful exports",
        },
      },
      funnel: {
        available: true,
        reason: null,
        stages: funnelStages,
        largestDropoffStageId: findLargestDropoffStageId(funnelStages),
      },
      bookStatusBreakdown: {
        items: toBreakdownItems(bookStatusCounts),
      },
      exportStatusBreakdown: {
        items: toBreakdownItems(exportStatusCounts),
      },
      billingPlanSnapshot,
      recentErrors,
      recentSignups: {
        items: recentSignups,
      },
      recentFailedExports: {
        items: failedExportItems,
      },
      recentAlerts: {
        items: buildAlerts({
          exportFailureRate: calculatePercentage(
            failureCountInRange,
            successCountInRange + failureCountInRange
          ),
          failedExportsCount: failureCountInRange,
          manualEntitlementCount,
          errorsAvailable: recentErrors.available,
        }),
      },
      lastUpdatedAt: Date.now(),
    };
  },
});
