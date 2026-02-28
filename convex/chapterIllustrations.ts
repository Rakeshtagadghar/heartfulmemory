import { action } from "./_generated/server";
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { assertCanAccessStorybook } from "./authz";
import { api } from "./_generated/api";
import { getConvexAutoIllustrateEnv } from "./env";
import { generateThemeForChapterDraft } from "./illustrate/themeGenerator";
import { fetchIllustrationCandidates } from "./illustrate/fetchCandidates";
import { selectCandidatesForSlots } from "./illustrate/selectForSlots";
import { cacheSelectedProviderAssets } from "./illustrate/cacheAssets";
import { extractSlotTargetsForChapter } from "../packages/shared/templates/slotTargets";
import { captureConvexError, captureConvexWarning, withConvexSpan } from "./observability/sentry";

type ConvexCtx = MutationCtx | QueryCtx;
type ChapterIllustrationDoc = Doc<"chapterIllustrations">;

const statusValidator = v.union(v.literal("selecting"), v.literal("ready"), v.literal("error"));
const themeValidator = v.object({
  queries: v.array(v.string()),
  keywords: v.array(v.string()),
  negativeKeywords: v.array(v.string())
});
const slotTargetValidator = v.object({
  slotId: v.string(),
  aspectTarget: v.number(),
  orientation: v.union(v.literal("landscape"), v.literal("portrait"), v.literal("square")),
  minShortSidePx: v.number()
});
const slotAssignmentValidator = v.object({
  slotId: v.string(),
  mediaAssetId: v.id("mediaAssets"),
  providerMetaSnapshot: v.any()
});
const providerModeValidator = v.union(v.literal("unsplash"), v.literal("pexels"), v.literal("both"));

function toIllustrationDto(doc: ChapterIllustrationDoc) {
  return {
    id: String(doc._id),
    storybookId: String(doc.storybookId),
    chapterInstanceId: String(doc.chapterInstanceId),
    chapterKey: doc.chapterKey,
    version: doc.version,
    status: doc.status,
    theme: doc.theme,
    slotTargets: doc.slotTargets,
    slotAssignments: doc.slotAssignments.map((item) => ({
      slotId: item.slotId,
      mediaAssetId: String(item.mediaAssetId),
      providerMetaSnapshot: item.providerMetaSnapshot
    })),
    lockedSlotIds: doc.lockedSlotIds,
    errorCode: doc.errorCode ?? null,
    errorMessage: doc.errorMessage ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

async function getChapterOrThrow(ctx: ConvexCtx, chapterInstanceId: Id<"storybookChapters">) {
  const row = await ctx.db.get(chapterInstanceId);
  if (!row) throw new Error("Chapter instance not found");
  return row;
}

async function getIllustrationOrThrow(ctx: ConvexCtx, illustrationId: Id<"chapterIllustrations">) {
  const row = await ctx.db.get(illustrationId);
  if (!row) throw new Error("Chapter illustration not found");
  return row;
}

async function assertChapterBelongsToStorybook(
  ctx: ConvexCtx,
  storybookId: Id<"storybooks">,
  chapterInstanceId: Id<"storybookChapters">
) {
  const chapter = await getChapterOrThrow(ctx, chapterInstanceId);
  if (String(chapter.storybookId) !== String(storybookId)) {
    throw new Error("Chapter does not belong to storybook");
  }
  return chapter;
}

async function touchStorybook(ctx: MutationCtx, storybookId: Id<"storybooks">, at = Date.now()) {
  await ctx.db.patch(storybookId, { updatedAt: at });
}

async function nextVersionForChapter(ctx: MutationCtx, chapterInstanceId: Id<"storybookChapters">) {
  const rows = await ctx.db
    .query("chapterIllustrations")
    .withIndex("by_chapterInstanceId", (q) => q.eq("chapterInstanceId", chapterInstanceId))
    .collect();
  return rows.reduce((max, row) => Math.max(max, row.version), 0) + 1;
}

function sortByVersionDesc<T extends { version: number }>(rows: T[]) {
  return [...rows].sort((a, b) => b.version - a.version);
}

const autoIllustrateWindowMs = 60 * 1000;
const autoIllustrateRequestsByUser = new Map<string, number[]>();

function checkAndRecordAutoIllustrateRateLimit(subject: string, limitPerWindow: number) {
  if (limitPerWindow <= 0) return { allowed: true as const };
  const now = Date.now();
  const recent = (autoIllustrateRequestsByUser.get(subject) ?? []).filter((ts) => now - ts < autoIllustrateWindowMs);
  if (recent.length >= limitPerWindow) {
    autoIllustrateRequestsByUser.set(subject, recent);
    return { allowed: false as const };
  }
  recent.push(now);
  autoIllustrateRequestsByUser.set(subject, recent);
  return { allowed: true as const };
}

async function requireActionUser(ctx: ActionCtx, explicitSubject?: string) {
  const identity = await ctx.auth.getUserIdentity();
  const subject = identity?.subject || identity?.tokenIdentifier || explicitSubject || null;
  if (!subject) throw new Error("Unauthorized");
  return { subject };
}

export const listByChapter = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    chapterInstanceId: v.id("storybookChapters")
  },
  handler: async (ctx, args) => {
    const chapter = await getChapterOrThrow(ctx, args.chapterInstanceId);
    await assertCanAccessStorybook(ctx, chapter.storybookId, "OWNER", args.viewerSubject);
    const rows = await ctx.db
      .query("chapterIllustrations")
      .withIndex("by_chapterInstanceId", (q) => q.eq("chapterInstanceId", args.chapterInstanceId))
      .collect();
    return sortByVersionDesc(rows).map(toIllustrationDto);
  }
});

export const getLatestByChapterInstance = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    chapterInstanceId: v.id("storybookChapters")
  },
  handler: async (ctx, args) => {
    const chapter = await getChapterOrThrow(ctx, args.chapterInstanceId);
    await assertCanAccessStorybook(ctx, chapter.storybookId, "OWNER", args.viewerSubject);
    const rows = await ctx.db
      .query("chapterIllustrations")
      .withIndex("by_chapterInstanceId", (q) => q.eq("chapterInstanceId", args.chapterInstanceId))
      .collect();
    const latest = sortByVersionDesc(rows)[0] ?? null;
    return latest ? toIllustrationDto(latest) : null;
  }
});

export const getByChapterInstance = queryGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    chapterInstanceId: v.id("storybookChapters")
  },
  handler: async (ctx, args) => {
    const chapter = await getChapterOrThrow(ctx, args.chapterInstanceId);
    await assertCanAccessStorybook(ctx, chapter.storybookId, "OWNER", args.viewerSubject);
    const rows = await ctx.db
      .query("chapterIllustrations")
      .withIndex("by_chapterInstanceId", (q) => q.eq("chapterInstanceId", args.chapterInstanceId))
      .collect();
    const latest = sortByVersionDesc(rows)[0] ?? null;
    if (!latest) return null;

    const mapped: Record<string, unknown> = {};
    for (const assignment of latest.slotAssignments) {
      const media = await ctx.db.get(assignment.mediaAssetId);
      if (!media) continue;
      mapped[assignment.slotId] = {
        mediaAssetId: String(media._id),
        cachedUrl: media.cachedUrl,
        thumbUrl: media.thumbUrl ?? null,
        width: media.width,
        height: media.height,
        attribution: media.attribution,
        providerMetaSnapshot: assignment.providerMetaSnapshot
      };
    }

    return {
      illustrationId: String(latest._id),
      version: latest.version,
      status: latest.status,
      chapterInstanceId: String(latest.chapterInstanceId),
      chapterKey: latest.chapterKey,
      slots: mapped
    };
  }
});

export const beginVersion = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters"),
    chapterKey: v.string(),
    theme: themeValidator,
    slotTargets: v.array(slotTargetValidator),
    lockedSlotIds: v.optional(v.array(v.string())),
    reuseIfReady: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    await assertCanAccessStorybook(ctx, args.storybookId, "OWNER", args.viewerSubject);
    await assertChapterBelongsToStorybook(ctx, args.storybookId, args.chapterInstanceId);

    const existingRows = await ctx.db
      .query("chapterIllustrations")
      .withIndex("by_chapterInstanceId", (q) => q.eq("chapterInstanceId", args.chapterInstanceId))
      .collect();
    const latest = sortByVersionDesc(existingRows)[0] ?? null;

    if (args.reuseIfReady !== false && latest && latest.status === "ready") {
      return {
        ok: true as const,
        reused: true as const,
        illustrationId: latest._id,
        illustration: toIllustrationDto(latest)
      };
    }
    if (existingRows.some((row) => row.status === "selecting")) {
      return { ok: false as const, errorCode: "ILLUSTRATION_ALREADY_SELECTING" as const };
    }

    const now = Date.now();
    const nextVersion = await nextVersionForChapter(ctx, args.chapterInstanceId);
    const id = await ctx.db.insert("chapterIllustrations", {
      storybookId: args.storybookId,
      chapterInstanceId: args.chapterInstanceId,
      chapterKey: args.chapterKey,
      version: nextVersion,
      status: "selecting",
      theme: args.theme,
      slotTargets: args.slotTargets,
      slotAssignments: [],
      lockedSlotIds: args.lockedSlotIds ?? latest?.lockedSlotIds ?? [],
      errorCode: null,
      errorMessage: null,
      createdAt: now,
      updatedAt: now
    });
    await touchStorybook(ctx, args.storybookId, now);
    const row = await ctx.db.get(id);
    if (!row) throw new Error("Failed to create chapter illustration version");
    return {
      ok: true as const,
      reused: false as const,
      illustrationId: row._id,
      illustration: toIllustrationDto(row)
    };
  }
});

export const setReady = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    illustrationId: v.id("chapterIllustrations"),
    theme: v.optional(themeValidator),
    slotTargets: v.optional(v.array(slotTargetValidator)),
    slotAssignments: v.array(slotAssignmentValidator),
    lockedSlotIds: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    const row = await getIllustrationOrThrow(ctx, args.illustrationId);
    await assertCanAccessStorybook(ctx, row.storybookId, "OWNER", args.viewerSubject);
    const now = Date.now();
    await ctx.db.patch(row._id, {
      status: "ready",
      theme: args.theme ?? row.theme,
      slotTargets: args.slotTargets ?? row.slotTargets,
      slotAssignments: args.slotAssignments,
      lockedSlotIds: args.lockedSlotIds ?? row.lockedSlotIds,
      errorCode: null,
      errorMessage: null,
      updatedAt: now
    });
    await touchStorybook(ctx, row.storybookId, now);
    const updated = await ctx.db.get(row._id);
    if (!updated) throw new Error("Chapter illustration not found");
    return { ok: true as const, illustration: toIllustrationDto(updated) };
  }
});

export const setError = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    illustrationId: v.id("chapterIllustrations"),
    errorCode: v.string(),
    errorMessage: v.optional(v.union(v.string(), v.null()))
  },
  handler: async (ctx, args) => {
    const row = await getIllustrationOrThrow(ctx, args.illustrationId);
    await assertCanAccessStorybook(ctx, row.storybookId, "OWNER", args.viewerSubject);
    const now = Date.now();
    await ctx.db.patch(row._id, {
      status: "error",
      errorCode: args.errorCode,
      errorMessage: args.errorMessage ?? null,
      updatedAt: now
    });
    await touchStorybook(ctx, row.storybookId, now);
    const updated = await ctx.db.get(row._id);
    if (!updated) throw new Error("Chapter illustration not found");
    return { ok: true as const, illustration: toIllustrationDto(updated) };
  }
});

export const toggleLockSlot = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    illustrationId: v.id("chapterIllustrations"),
    slotId: v.string()
  },
  handler: async (ctx, args) => {
    const row = await getIllustrationOrThrow(ctx, args.illustrationId);
    await assertCanAccessStorybook(ctx, row.storybookId, "OWNER", args.viewerSubject);
    const locked = new Set(row.lockedSlotIds);
    if (locked.has(args.slotId)) locked.delete(args.slotId);
    else locked.add(args.slotId);
    const nextLockedSlotIds = Array.from(locked).sort();
    await ctx.db.patch(row._id, { lockedSlotIds: nextLockedSlotIds, updatedAt: Date.now() });
    const updated = await ctx.db.get(row._id);
    if (!updated) throw new Error("Chapter illustration not found");
    return { ok: true as const, illustration: toIllustrationDto(updated) };
  }
});

export const replaceSlotAssignment = mutationGeneric({
  args: {
    viewerSubject: v.optional(v.string()),
    illustrationId: v.id("chapterIllustrations"),
    slotId: v.string(),
    mediaAssetId: v.id("mediaAssets"),
    providerMetaSnapshot: v.any()
  },
  handler: async (ctx, args) => {
    const row = await getIllustrationOrThrow(ctx, args.illustrationId);
    await assertCanAccessStorybook(ctx, row.storybookId, "OWNER", args.viewerSubject);
    const media = await ctx.db.get(args.mediaAssetId);
    if (!media) throw new Error("Media asset not found");

    let replaced = false;
    const nextAssignments = row.slotAssignments.map((assignment) => {
      if (assignment.slotId !== args.slotId) return assignment;
      replaced = true;
      return {
        slotId: args.slotId,
        mediaAssetId: args.mediaAssetId,
        providerMetaSnapshot: args.providerMetaSnapshot
      };
    });
    if (!replaced) {
      nextAssignments.push({
        slotId: args.slotId,
        mediaAssetId: args.mediaAssetId,
        providerMetaSnapshot: args.providerMetaSnapshot
      });
    }

    await ctx.db.patch(row._id, {
      slotAssignments: nextAssignments,
      status: "ready",
      updatedAt: Date.now()
    });
    const updated = await ctx.db.get(row._id);
    if (!updated) throw new Error("Chapter illustration not found");
    return { ok: true as const, illustration: toIllustrationDto(updated) };
  }
});

export const autoIllustrate = action({
  args: {
    viewerSubject: v.optional(v.string()),
    storybookId: v.id("storybooks"),
    chapterInstanceId: v.id("storybookChapters"),
    providerMode: v.optional(providerModeValidator),
    regenerate: v.optional(v.boolean())
  },
  handler: async (ctx, args): Promise<any> => {
    try {
      const viewer = await requireActionUser(ctx, args.viewerSubject);
      const config = getConvexAutoIllustrateEnv();
      const rate = checkAndRecordAutoIllustrateRateLimit(viewer.subject, config.rateLimitPerUser);
      if (!rate.allowed) {
        captureConvexWarning("Auto-illustrate rate limit reached", {
          flow: "auto_illustrate",
          code: "RATE_LIMIT",
          storybookId: String(args.storybookId),
          chapterInstanceId: String(args.chapterInstanceId)
        });
        return {
          ok: false as const,
          errorCode: "RATE_LIMIT" as const,
          message: "Auto-illustrate rate limit reached. Please try again shortly.",
          retryable: true
        };
      }

      const [storybook, chapter, narrative, existingIllustration] = await Promise.all([
        ctx.runQuery(api.storybooks.getGuidedById, {
          viewerSubject: viewer.subject,
          storybookId: args.storybookId
        }),
        ctx.runQuery(api.storybookChapters.get, {
          viewerSubject: viewer.subject,
          chapterInstanceId: args.chapterInstanceId
        }),
        ctx.runQuery(api.chapterNarratives.getByChapterInstanceId, {
          chapterInstanceId: args.chapterInstanceId
        }),
        ctx.runQuery(api.chapterIllustrations.getLatestByChapterInstance, {
          viewerSubject: viewer.subject,
          chapterInstanceId: args.chapterInstanceId
        })
      ]);
      const templateJson = storybook.templateId
        ? await ctx.runQuery(api.templates.getById, { templateId: storybook.templateId })
        : null;

      if (!narrative || narrative.status !== "ready") {
        return {
          ok: false as const,
          errorCode: "DRAFT_NOT_READY" as const,
          message: "Generate a chapter narrative first before auto-illustrating.",
          retryable: false
        };
      }

      const slotTargets = extractSlotTargetsForChapter((templateJson as any) ?? { chapters: [] }, chapter.chapterKey);

      // Adapt narrative to a faux-draft object for the theme generator
      const mockSections = [
        { sectionId: "opening", title: "Opening", text: narrative.paragraphs?.opening ?? "" },
        { sectionId: "story", title: "Story", text: narrative.paragraphs?.story ?? "" },
        { sectionId: "closing", title: "Closing", text: narrative.paragraphs?.closing ?? "" }
      ];

      const theme = generateThemeForChapterDraft({
        chapterTitle: chapter.title,
        chapterKey: chapter.chapterKey,
        storybook,
        chapterDraft: { sections: mockSections } as any
      });

      const begin = await ctx.runMutation(api.chapterIllustrations.beginVersion, {
        viewerSubject: viewer.subject,
        storybookId: args.storybookId,
        chapterInstanceId: args.chapterInstanceId,
        chapterKey: chapter.chapterKey,
        theme,
        slotTargets,
        lockedSlotIds: existingIllustration?.lockedSlotIds ?? [],
        reuseIfReady: args.regenerate ? false : true
      });

      if (!begin.ok) {
        return {
          ok: false as const,
          errorCode: begin.errorCode,
          message: "Illustration selection is already in progress for this chapter.",
          retryable: true
        };
      }
      if (begin.reused) {
        return {
          ok: true as const,
          illustration: begin.illustration,
          reused: true as const,
          warnings: []
        };
      }

      const providerMode = (args.providerMode ?? config.providerModeDefault) as "unsplash" | "pexels" | "both";
      const allCandidates = await withConvexSpan(
        "illustrations_fetch_candidates",
        {
          flow: "auto_illustrate",
          provider: providerMode,
          storybookId: String(args.storybookId),
          chapterKey: chapter.chapterKey,
          chapterInstanceId: String(args.chapterInstanceId)
        },
        async () => {
          const candidates: Array<any> = [];
          for (const slot of slotTargets) {
            const fetched = await fetchIllustrationCandidates({
              providerMode,
              queries: theme.queries,
              orientation: slot.orientation,
              minShortSidePx: slot.minShortSidePx,
              perQueryLimit: config.maxCandidatesPerSlot
            });
            if (fetched.ok) {
              candidates.push(...fetched.candidates);
            }
          }
          return candidates;
        }
      );

      const lockedSlotIds = existingIllustration?.lockedSlotIds ?? [];
      const unlockedSlotTargets = slotTargets.filter((slot) => !lockedSlotIds.includes(slot.slotId));
      const selection = selectCandidatesForSlots({
        slotTargets: unlockedSlotTargets,
        candidates: allCandidates,
        keywords: theme.keywords,
        lockedSlotIds,
        existingAssignments: []
      });

      const chosen = selection.selections
        .filter((row) => row.candidate)
        .map((row) => ({ slotId: row.slotId, candidate: row.candidate! }));

      if (chosen.length === 0) {
        captureConvexWarning("No illustration candidates available", {
          flow: "auto_illustrate",
          code: "NO_CANDIDATES",
          provider: providerMode,
          storybookId: String(args.storybookId),
          chapterKey: chapter.chapterKey,
          chapterInstanceId: String(args.chapterInstanceId)
        });
        await ctx.runMutation(api.chapterIllustrations.setError, {
          viewerSubject: viewer.subject,
          illustrationId: begin.illustrationId,
          errorCode: "NO_CANDIDATES",
          errorMessage: "No print-safe images found for this chapter."
        });
        return {
          ok: false as const,
          errorCode: "NO_CANDIDATES" as const,
          message: "No print-safe images found for this chapter.",
          retryable: true
        };
      }

      const cached = await withConvexSpan(
        "illustrations_cache_assets",
        {
          flow: "auto_illustrate",
          provider: providerMode,
          storybookId: String(args.storybookId),
          chapterKey: chapter.chapterKey,
          chapterInstanceId: String(args.chapterInstanceId)
        },
        () =>
          cacheSelectedProviderAssets({
            ctx,
            viewerSubject: viewer.subject,
            assets: chosen.map((row) => row.candidate),
            maxDownloadMb: config.maxDownloadMb,
            timeoutMs: 45000
          })
      );

      const cachedByProviderId = new Map(cached.map((row: any) => [`${row.providerAsset.provider}:${row.providerAsset.id}`, row] as const));
      const slotAssignments = chosen.flatMap((row) => {
        const cachedRow = cachedByProviderId.get(`${row.candidate.provider}:${row.candidate.id}`);
        if (!cachedRow) return [];
        return [
          {
            slotId: row.slotId,
            mediaAssetId: (cachedRow as any).mediaAssetId,
            providerMetaSnapshot: {
              provider: row.candidate.provider,
              sourceId: row.candidate.id,
              query: row.candidate.query ?? null,
              authorName: row.candidate.authorName,
              authorUrl: row.candidate.authorUrl ?? null,
              assetUrl: row.candidate.assetUrl ?? null,
              licenseUrl: row.candidate.licenseUrl ?? null,
              cacheMode: (cachedRow as any).cacheMode
            }
          }
        ];
      });

      const preservedLockedAssignments =
        existingIllustration?.slotAssignments.filter((assignment: any) => lockedSlotIds.includes(assignment.slotId)) ?? [];
      const mergedAssignments = [...preservedLockedAssignments, ...slotAssignments].sort((a, b) =>
        a.slotId.localeCompare(b.slotId)
      );

      const ready = await ctx.runMutation(api.chapterIllustrations.setReady, {
        viewerSubject: viewer.subject,
        illustrationId: begin.illustrationId,
        theme,
        slotTargets,
        slotAssignments: mergedAssignments as any,
        lockedSlotIds
      });

      return {
        ok: true as const,
        illustration: ready.illustration,
        reused: false as const,
        warnings: selection.warnings
      };
    } catch (error) {
      captureConvexError(error, {
        flow: "auto_illustrate",
        code: "AUTO_ILLUSTRATE_FAILED",
        storybookId: String(args.storybookId),
        chapterInstanceId: String(args.chapterInstanceId)
      });
      return {
        ok: false as const,
        errorCode: "AUTO_ILLUSTRATE_FAILED" as const,
        message: error instanceof Error ? error.message : "Auto-illustrate failed",
        retryable: true
      };
    }
  }
});
