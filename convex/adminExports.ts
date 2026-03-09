import { queryGeneric } from "convex/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  buildAdminFailureSummary,
  classifyAdminExportFailure,
  createAdminExportRecordId,
  getAdminRetryEligibility,
  normalizeAdminExportStatus,
  normalizeExportFormatFromJobType,
  normalizeExportFormatFromTarget,
  parseAdminExportRecordId,
  type AdminExportFailureCategory,
  type AdminExportFormat,
  type AdminExportJobDetail,
  type AdminExportJobStatus,
  type AdminExportJobSummary,
  type AdminExportJobsListResponse,
  type AdminProjectExportHistoryItem,
  type AdminProjectExportHistoryResponse,
  type AdminExportTarget,
} from "../packages/shared/admin/exportMonitoring";

type ExportJobRow = {
  _id: Id<"exportJobs">;
  userId: string;
  storybookId: Id<"storybooks">;
  type: "pdf" | "docx" | "pptx";
  triggerSource?: "user" | "admin_retry";
  requestedByUserId?: string | null;
  retryOfJobId?: Id<"exportJobs"> | null;
  retrySourceRecordId?: string | null;
  retrySourceRecordKind?: "job" | "attempt" | null;
  status: "queued" | "running" | "done" | "error";
  artifactId?: Id<"exportArtifacts"> | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt: number;
  updatedAt: number;
};

type ExportAttemptRow = {
  _id: Id<"exports">;
  storybookId: Id<"storybooks">;
  ownerId: string;
  exportTarget: string;
  exportHash: string;
  status: "SUCCESS" | "FAILED";
  pageCount: number;
  warningsCount: number;
  runtimeMs?: number;
  fileKey?: string;
  fileUrl?: string;
  errorSummary?: string;
  createdAt: number;
};

type UnifiedAdminExportRecord = {
  id: string;
  source: "job" | "attempt";
  sourceRecordId: string;
  jobId: string | null;
  exportHash: string | null;
  storybookId: string;
  ownerId: string;
  format: AdminExportFormat;
  exportTarget: AdminExportTarget | null;
  status: AdminExportJobStatus;
  failureCategory: AdminExportFailureCategory | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: number;
  completedAt: number | null;
  durationMs: number | null;
  artifactId: string | null;
  pageCount: number | null;
  warningsCount: number | null;
  triggerSource: string | null;
  retryOfJobId: string | null;
  retrySourceRecordId: string | null;
  retrySourceRecordKind: "job" | "attempt" | null;
};

type JoinedContext = {
  projectById: Map<string, { title: string; status: string | null }>;
  ownerById: Map<string, { displayName: string | null; email: string | null }>;
  attemptNumberByRecordId: Map<string, number>;
  latestByProjectId: Map<string, UnifiedAdminExportRecord>;
};

function getResolvedRecordId(value: string): { source: "job" | "attempt"; sourceId: string } {
  const parsed = parseAdminExportRecordId(value);
  if (parsed) return parsed;
  return { source: "job", sourceId: value };
}

function toTargetFromJob(row: ExportJobRow, linkedAttempt: ExportAttemptRow | null): AdminExportTarget | null {
  if (linkedAttempt?.exportTarget === "DIGITAL_PDF" || linkedAttempt?.exportTarget === "HARDCOPY_PRINT_PDF") {
    return linkedAttempt.exportTarget;
  }
  if (row.type === "docx") return "DOCX";
  if (row.type === "pptx") return "PPTX";
  return "DIGITAL_PDF";
}

function toCompletedAt(input: {
  status: AdminExportJobStatus;
  createdAt: number;
  updatedAt?: number | null;
  attemptCreatedAt?: number | null;
}): number | null {
  if (input.status === "queued" || input.status === "processing") return null;
  return input.attemptCreatedAt ?? input.updatedAt ?? input.createdAt;
}

function buildUnifiedRecords(input: {
  exportJobs: ExportJobRow[];
  exportAttempts: ExportAttemptRow[];
}): UnifiedAdminExportRecord[] {
  const jobIds = new Set(input.exportJobs.map((row) => String(row._id)));
  const attemptsByHash = new Map<string, ExportAttemptRow[]>();

  for (const attempt of input.exportAttempts) {
    const key = attempt.exportHash;
    const existing = attemptsByHash.get(key) ?? [];
    existing.push(attempt);
    attemptsByHash.set(key, existing);
  }

  const jobRecords = input.exportJobs.map((job) => {
    const jobId = String(job._id);
    const linkedAttempt = (attemptsByHash.get(jobId) ?? [])
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;

    const status = normalizeAdminExportStatus(job.status);
    const errorMessage = linkedAttempt?.errorSummary ?? job.errorMessage ?? null;
    const failureCategory = classifyAdminExportFailure({
      status,
      errorCode: job.errorCode ?? null,
      errorMessage,
    });

    return {
      id: createAdminExportRecordId("job", jobId),
      source: "job" as const,
      sourceRecordId: jobId,
      jobId,
      exportHash: linkedAttempt?.exportHash ?? jobId,
      storybookId: String(job.storybookId),
      ownerId: job.userId,
      format: normalizeExportFormatFromJobType(job.type),
      exportTarget: toTargetFromJob(job, linkedAttempt),
      status,
      failureCategory,
      errorCode: job.errorCode ?? null,
      errorMessage,
      createdAt: job.createdAt,
      completedAt: toCompletedAt({
        status,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        attemptCreatedAt: linkedAttempt?.createdAt ?? null,
      }),
      durationMs:
        linkedAttempt?.runtimeMs ??
        (status === "queued" || status === "processing"
          ? null
          : Math.max(0, job.updatedAt - job.createdAt)),
      artifactId: job.artifactId ? String(job.artifactId) : null,
      pageCount: linkedAttempt?.pageCount ?? null,
      warningsCount: linkedAttempt?.warningsCount ?? null,
      triggerSource: job.triggerSource ?? "user",
      retryOfJobId: job.retryOfJobId ? String(job.retryOfJobId) : null,
      retrySourceRecordId: job.retrySourceRecordId ?? null,
      retrySourceRecordKind: job.retrySourceRecordKind ?? null,
    };
  });

  const standaloneAttemptRecords = input.exportAttempts
    .filter((attempt) => !jobIds.has(attempt.exportHash))
    .map((attempt) => {
      const status = normalizeAdminExportStatus(attempt.status);
      const failureCategory = classifyAdminExportFailure({
        status,
        errorCode: status === "failed" ? "EXPORT_ATTEMPT_FAILED" : null,
        errorMessage: attempt.errorSummary ?? null,
      });

      return {
        id: createAdminExportRecordId("attempt", String(attempt._id)),
        source: "attempt" as const,
        sourceRecordId: String(attempt._id),
        jobId: null,
        exportHash: attempt.exportHash,
        storybookId: String(attempt.storybookId),
        ownerId: attempt.ownerId,
        format: normalizeExportFormatFromTarget(attempt.exportTarget),
        exportTarget:
          attempt.exportTarget === "DIGITAL_PDF" ||
          attempt.exportTarget === "HARDCOPY_PRINT_PDF" ||
          attempt.exportTarget === "DOCX" ||
          attempt.exportTarget === "PPTX"
            ? (attempt.exportTarget as AdminExportTarget)
            : null,
        status,
        failureCategory,
        errorCode: status === "failed" ? "EXPORT_ATTEMPT_FAILED" : null,
        errorMessage: attempt.errorSummary ?? null,
        createdAt: attempt.createdAt,
        completedAt: attempt.createdAt,
        durationMs: attempt.runtimeMs ?? null,
        artifactId: null,
        pageCount: attempt.pageCount ?? null,
        warningsCount: attempt.warningsCount ?? null,
        triggerSource: "user",
        retryOfJobId: null,
        retrySourceRecordId: null,
        retrySourceRecordKind: null,
      };
    });

  return [...jobRecords, ...standaloneAttemptRecords];
}

async function buildJoinedContext(
  ctx: { db: any },
  records: UnifiedAdminExportRecord[]
): Promise<JoinedContext> {
  const projectIds = [...new Set(records.map((record) => record.storybookId))];
  const ownerIds = [...new Set(records.map((record) => record.ownerId))];

  const projects = await Promise.all(
    projectIds.map(async (projectId) => {
      const storybook = await ctx.db.get(projectId as Id<"storybooks">);
      return [
        projectId,
        {
          title: storybook?.title ?? "Untitled project",
          status: storybook?.status ?? null,
        },
      ] as const;
    })
  );

  const owners = await Promise.all(
    ownerIds.map(async (ownerId) => {
      const user = await ctx.db
        .query("users")
        .withIndex("by_auth_subject", (q: any) => q.eq("authSubject", ownerId))
        .unique();
      return [
        ownerId,
        {
          displayName: user?.display_name ?? null,
          email: user?.primaryEmail ?? user?.email ?? null,
        },
      ] as const;
    })
  );

  const attemptNumberByRecordId = new Map<string, number>();
  const counters = new Map<string, number>();
  const sortedAscending = records.slice().sort((a, b) => a.createdAt - b.createdAt);
  for (const record of sortedAscending) {
    const key = `${record.storybookId}:${record.format}`;
    const nextCount = (counters.get(key) ?? 0) + 1;
    counters.set(key, nextCount);
    attemptNumberByRecordId.set(record.id, nextCount);
  }

  const latestByProjectId = new Map<string, UnifiedAdminExportRecord>();
  const sortedDescending = records.slice().sort((a, b) => b.createdAt - a.createdAt);
  for (const record of sortedDescending) {
    if (!latestByProjectId.has(record.storybookId)) {
      latestByProjectId.set(record.storybookId, record);
    }
  }

  return {
    projectById: new Map(projects),
    ownerById: new Map(owners),
    attemptNumberByRecordId,
    latestByProjectId,
  };
}

function toSummary(
  record: UnifiedAdminExportRecord,
  joined: JoinedContext,
  options: {
    includeOwnerEmail: boolean;
    includeFailureSummary: boolean;
  }
): AdminExportJobSummary {
  const project = joined.projectById.get(record.storybookId);
  const owner = joined.ownerById.get(record.ownerId);
  const latest = joined.latestByProjectId.get(record.storybookId);
  const retryEligibility = getAdminRetryEligibility({
    status: record.status,
    failureCategory: record.failureCategory,
    latestProjectExportInProgress:
      latest !== undefined &&
      (latest.status === "queued" || latest.status === "processing"),
    currentJobIsLatest: latest?.id === record.id,
  });

  return {
    id: record.id,
    source: record.source,
    sourceRecordId: record.sourceRecordId,
    jobId: record.jobId,
    exportHash: record.exportHash,
    projectId: record.storybookId,
    projectTitle: project?.title ?? "Untitled project",
    ownerDisplayName: owner?.displayName ?? null,
    ownerEmail: options.includeOwnerEmail ? owner?.email ?? null : null,
    format: record.format,
    exportTarget: record.exportTarget,
    status: record.status,
    failureCategory: record.failureCategory,
    failureSummary: buildAdminFailureSummary({
      category: record.failureCategory,
      rawMessage: record.errorMessage,
      includeRawMessage: options.includeFailureSummary,
    }),
    attemptNumber: joined.attemptNumberByRecordId.get(record.id) ?? 1,
    rendererVersion: null,
    createdAt: record.createdAt,
    completedAt: record.completedAt,
    durationMs: record.durationMs,
    retryEligibility,
  };
}

function toHistoryItem(
  record: UnifiedAdminExportRecord,
  joined: JoinedContext,
  options: {
    includeOwnerEmail: boolean;
    includeFailureSummary: boolean;
  }
): AdminProjectExportHistoryItem {
  const summary = toSummary(record, joined, options);
  return {
    ...summary,
    pageCount: record.pageCount,
    warningsCount: record.warningsCount,
  };
}

function matchesSearch(summary: AdminExportJobSummary, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [
    summary.id,
    summary.sourceRecordId,
    summary.jobId,
    summary.exportHash,
    summary.projectId,
    summary.projectTitle,
    summary.ownerDisplayName,
    summary.ownerEmail,
    summary.format,
    summary.exportTarget,
    summary.failureCategory,
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .some((value) => value.toLowerCase().includes(q));
}

function compareSummaries(
  left: AdminExportJobSummary,
  right: AdminExportJobSummary,
  sortBy: "createdAt" | "completedAt" | "duration",
  sortOrder: "asc" | "desc"
): number {
  const direction = sortOrder === "asc" ? 1 : -1;
  const leftValue =
    sortBy === "completedAt"
      ? left.completedAt ?? -1
      : sortBy === "duration"
        ? left.durationMs ?? -1
        : left.createdAt;
  const rightValue =
    sortBy === "completedAt"
      ? right.completedAt ?? -1
      : sortBy === "duration"
        ? right.durationMs ?? -1
        : right.createdAt;

  if (leftValue === rightValue) {
    if (left.id === right.id) return 0;
    return direction * (left.id < right.id ? -1 : 1);
  }
  return direction * (leftValue < rightValue ? -1 : 1);
}

export const listExportJobs = queryGeneric({
  args: {
    q: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("queued"),
        v.literal("processing"),
        v.literal("succeeded"),
        v.literal("failed")
      )
    ),
    failureCategory: v.optional(
      v.union(
        v.literal("validation_error"),
        v.literal("renderer_error"),
        v.literal("asset_fetch_error"),
        v.literal("storage_error"),
        v.literal("timeout"),
        v.literal("infrastructure_error"),
        v.literal("unknown_error")
      )
    ),
    retryEligible: v.optional(v.boolean()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    sortBy: v.optional(
      v.union(v.literal("createdAt"), v.literal("completedAt"), v.literal("duration"))
    ),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
    includeOwnerEmail: v.optional(v.boolean()),
    includeFailureSummary: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<AdminExportJobsListResponse> => {
    const page = Math.max(1, Math.floor(args.page ?? 1));
    const pageSize = Math.max(1, Math.min(100, Math.floor(args.pageSize ?? 25)));
    const exportJobs = (await ctx.db.query("exportJobs").collect()) as ExportJobRow[];
    const exportAttempts = (await ctx.db.query("exports").collect()) as ExportAttemptRow[];
    const unifiedRecords = buildUnifiedRecords({ exportJobs, exportAttempts });
    const joined = await buildJoinedContext(ctx, unifiedRecords);
    const includeOwnerEmail = args.includeOwnerEmail ?? false;
    const includeFailureSummary = args.includeFailureSummary ?? false;

    let items = unifiedRecords.map((record) =>
      toSummary(record, joined, { includeOwnerEmail, includeFailureSummary })
    );

    if (args.q?.trim()) {
      items = items.filter((item) => matchesSearch(item, args.q!));
    }
    if (args.status) {
      items = items.filter((item) => item.status === args.status);
    }
    if (args.failureCategory) {
      items = items.filter((item) => item.failureCategory === args.failureCategory);
    }
    if (typeof args.retryEligible === "boolean") {
      items = items.filter((item) => item.retryEligibility.eligible === args.retryEligible);
    }
    if (typeof args.dateFrom === "number") {
      items = items.filter((item) => item.createdAt >= args.dateFrom!);
    }
    if (typeof args.dateTo === "number") {
      items = items.filter((item) => item.createdAt <= args.dateTo!);
    }

    const sortBy = args.sortBy ?? "createdAt";
    const sortOrder = args.sortOrder ?? "desc";
    items.sort((left, right) => compareSummaries(left, right, sortBy, sortOrder));

    const total = items.length;
    const start = (page - 1) * pageSize;

    return {
      items: items.slice(start, start + pageSize),
      pagination: {
        page,
        pageSize,
        total,
      },
    };
  },
});

export const getExportJobDetail = queryGeneric({
  args: {
    exportId: v.string(),
    includeOwnerEmail: v.optional(v.boolean()),
    includeFailureSummary: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<AdminExportJobDetail | null> => {
    const exportJobs = (await ctx.db.query("exportJobs").collect()) as ExportJobRow[];
    const exportAttempts = (await ctx.db.query("exports").collect()) as ExportAttemptRow[];
    const unifiedRecords = buildUnifiedRecords({ exportJobs, exportAttempts });
    const joined = await buildJoinedContext(ctx, unifiedRecords);
    const resolved = getResolvedRecordId(args.exportId);
    const record = unifiedRecords.find(
      (candidate) =>
        candidate.source === resolved.source && candidate.sourceRecordId === resolved.sourceId
    );

    if (!record) return null;

    const summary = toSummary(record, joined, {
      includeOwnerEmail: args.includeOwnerEmail ?? false,
      includeFailureSummary: args.includeFailureSummary ?? false,
    });

    let outputArtifactSummary: AdminExportJobDetail["outputArtifactSummary"] = null;
    if (record.artifactId) {
      const artifact = await ctx.db.get(record.artifactId as Id<"exportArtifacts">);
      if (artifact) {
        outputArtifactSummary = {
          id: String(artifact._id),
          filename: artifact.filename,
          mimeType: artifact.mimeType,
          sizeBytes: artifact.sizeBytes,
          createdAt: artifact.createdAt,
        };
      }
    }

    return {
      ...summary,
      projectStatus: joined.projectById.get(record.storybookId)?.status ?? null,
      ownerId: record.ownerId,
      failureCode: args.includeFailureSummary ? record.errorCode : null,
      triggerSource: record.triggerSource,
      pageCount: record.pageCount,
      warningsCount: record.warningsCount,
      retryOfJobId: record.retryOfJobId,
      outputArtifactSummary,
    };
  },
});

export const getProjectExportHistory = queryGeneric({
  args: {
    projectId: v.string(),
    limit: v.optional(v.number()),
    includeOwnerEmail: v.optional(v.boolean()),
    includeFailureSummary: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<AdminProjectExportHistoryResponse | null> => {
    const project = await ctx.db.get(args.projectId as Id<"storybooks">);
    if (!project) return null;

    const exportJobs = (await ctx.db.query("exportJobs").collect()) as ExportJobRow[];
    const exportAttempts = (await ctx.db.query("exports").collect()) as ExportAttemptRow[];
    const unifiedRecords = buildUnifiedRecords({ exportJobs, exportAttempts }).filter(
      (record) => record.storybookId === args.projectId
    );
    const joined = await buildJoinedContext(ctx, unifiedRecords);
    const limit = Math.max(1, Math.min(50, Math.floor(args.limit ?? 10)));

    const items = unifiedRecords
      .map((record) =>
        toHistoryItem(record, joined, {
          includeOwnerEmail: args.includeOwnerEmail ?? false,
          includeFailureSummary: args.includeFailureSummary ?? false,
        })
      )
      .sort((left, right) => right.createdAt - left.createdAt)
      .slice(0, limit);

    return {
      items,
      total: unifiedRecords.length,
    };
  },
});
