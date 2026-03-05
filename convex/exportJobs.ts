import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { assertCanAccessStorybook, requireUser } from "./authz";

const exportTypeValidator = v.union(v.literal("pdf"), v.literal("docx"), v.literal("pptx"));
const jobStatusValidator = v.union(
  v.literal("queued"),
  v.literal("running"),
  v.literal("done"),
  v.literal("error")
);

export const createJob = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    type: exportTypeValidator,
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const now = Date.now();
    const jobId = await ctx.db.insert("exportJobs", {
      userId: access.storybook.ownerId,
      storybookId: args.storybookId,
      type: args.type,
      status: "queued",
      createdAt: now,
      updatedAt: now,
    });
    return { jobId: String(jobId) };
  },
});

export const updateJobStatus = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    jobId: v.id("exportJobs"),
    status: jobStatusValidator,
    artifactId: v.optional(v.union(v.id("exportArtifacts"), v.null())),
    errorCode: v.optional(v.union(v.string(), v.null())),
    errorMessage: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");
    if (job.userId !== viewer.subject) throw new Error("Unauthorized");

    await ctx.db.patch(args.jobId, {
      status: args.status,
      artifactId: args.artifactId ?? job.artifactId,
      errorCode: args.errorCode ?? job.errorCode,
      errorMessage: args.errorMessage ?? job.errorMessage,
      updatedAt: Date.now(),
    });
  },
});

export const createArtifact = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    jobId: v.id("exportJobs"),
    type: exportTypeValidator,
    filename: v.string(),
    r2Key: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");
    if (job.userId !== viewer.subject) throw new Error("Unauthorized");

    const artifactId = await ctx.db.insert("exportArtifacts", {
      userId: viewer.subject,
      storybookId: args.storybookId,
      jobId: args.jobId,
      type: args.type,
      filename: args.filename,
      r2Key: args.r2Key,
      mimeType: args.mimeType,
      sizeBytes: args.sizeBytes,
      createdAt: Date.now(),
    });
    return { artifactId: String(artifactId) };
  },
});

export const getJob = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    jobId: v.id("exportJobs"),
  },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx, args.viewerSubject);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");
    if (job.userId !== viewer.subject) throw new Error("Unauthorized");

    return {
      id: String(job._id),
      storybookId: String(job.storybookId),
      type: job.type,
      status: job.status,
      artifactId: job.artifactId ? String(job.artifactId) : null,
      errorCode: job.errorCode ?? null,
      errorMessage: job.errorMessage ?? null,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  },
});

export const getArtifacts = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const rows = await ctx.db
      .query("exportArtifacts")
      .withIndex("by_storybookId", (q) => q.eq("storybookId", args.storybookId))
      .collect();

    return rows
      .filter((r) => r.userId === access.storybook.ownerId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, Math.min(args.limit ?? 20, 50))
      .map((r) => ({
        id: String(r._id),
        storybookId: String(r.storybookId),
        jobId: String(r.jobId),
        type: r.type,
        filename: r.filename,
        r2Key: r.r2Key,
        mimeType: r.mimeType,
        sizeBytes: r.sizeBytes,
        createdAt: r.createdAt,
      }));
  },
});

/** Get content payload for DOCX export (chapters + answers + photos) */
export const getDocxExportPayload = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
  },
  handler: async (ctx, args) => {
    const access = await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    const storybook = access.storybook;

    // Fetch chapters
    const chapters = await ctx.db
      .query("storybookChapters")
      .withIndex("by_storybookId", (q) => q.eq("storybookId", args.storybookId))
      .collect();

    // Fetch all answers for this storybook
    const answers = await ctx.db
      .query("chapterAnswers")
      .withIndex("by_storybookId", (q) => q.eq("storybookId", args.storybookId))
      .collect();

    // Fetch photos
    const photos = await ctx.db
      .query("storybookPhotos")
      .withIndex("by_storybookId", (q) => q.eq("storybookId", args.storybookId))
      .collect();

    // Fetch assets for photos
    const assetIds = photos.map((p) => p.assetId);
    const assets: any[] = [];
    for (const assetId of assetIds) {
      const asset = await ctx.db.get(assetId);
      if (asset) assets.push(asset);
    }

    // Get user display name
    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", storybook.ownerId))
      .unique();

    return {
      storybook: {
        id: String(storybook._id),
        title: storybook.title,
        subtitle: storybook.subtitle ?? null,
        authorName: userDoc?.display_name ?? null,
      },
      chapters: chapters
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((ch) => ({
          id: String(ch._id),
          title: ch.title,
          orderIndex: ch.orderIndex,
          chapterKey: ch.chapterKey,
        })),
      answers: answers
        .filter((a) => !a.skipped)
        .map((a) => ({
          chapterInstanceId: String(a.chapterInstanceId),
          questionId: a.questionId,
          answerPlain: a.answerPlain ?? a.answerText ?? null,
        })),
      photos: photos
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .slice(0, 20)
        .map((p) => {
          const asset = assets.find((a) => String(a._id) === String(p.assetId));
          return {
            assetId: String(p.assetId),
            storageKey: asset?.storageKey ?? null,
            mimeType: asset?.mimeType ?? null,
            width: asset?.width ?? 0,
            height: asset?.height ?? 0,
            credit: asset?.license?.attributionText ?? null,
          };
        }),
    };
  },
});
