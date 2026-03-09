/**
 * Sprint 46: Admin lookup queries — users and projects.
 * Read-only queries for admin support tooling.
 */
import { queryGeneric } from "convex/server";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

/** List all users with basic summary fields (no secrets). */
export const listUsers = queryGeneric({
  args: {
    searchQuery: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);

    // Convex doesn't support full-text search on all fields natively.
    // We fetch all users and filter in-memory for v1. For scale, add a
    // dedicated search index later.
    const allUsers = await ctx.db.query("users").collect();

    let filtered = allUsers;
    const q = args.searchQuery?.trim().toLowerCase();
    if (q && q.length > 0) {
      filtered = allUsers.filter((u) => {
        const email = (u.primaryEmail ?? u.email ?? "").toLowerCase();
        const name = (u.display_name ?? "").toLowerCase();
        const id = u.authSubject.toLowerCase();
        return email.includes(q) || name.includes(q) || id.includes(q);
      });
    }

    // Sort by createdAt desc
    filtered.sort((a, b) => b.createdAt - a.createdAt);
    const page = filtered.slice(0, limit);

    // Count projects per user
    const results = await Promise.all(
      page.map(async (u) => {
        const storybooks = await ctx.db
          .query("storybooks")
          .withIndex("by_ownerId", (q) => q.eq("ownerId", u.authSubject))
          .collect();
        const activeProjects = storybooks.filter((s) => s.status !== "DELETED");

        return {
          id: u.authSubject,
          displayName: u.display_name ?? null,
          email: u.primaryEmail ?? u.email ?? null,
          accountStatus: u.deletionStatus ?? "active",
          onboardingCompleted: u.onboarding_completed,
          onboardingGoal: u.onboarding_goal ?? null,
          projectCount: activeProjects.length,
          lastActivityAt: u.lastActivityAt ?? null,
          createdAt: u.createdAt,
        };
      })
    );

    return { items: results, total: filtered.length };
  },
});

/** Get a single user by authSubject with linked project summaries. */
export const getUserDetail = queryGeneric({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", args.userId))
      .unique();

    if (!user) return null;

    // Get storybooks
    const storybooks = await ctx.db
      .query("storybooks")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", args.userId))
      .collect();

    const projectSummaries = await Promise.all(
      storybooks
        .filter((s) => s.status !== "DELETED")
        .map(async (s) => {
          // Count pages
          const pages = await ctx.db
            .query("pages")
            .withIndex("by_storybookId_orderIndex", (q) => q.eq("storybookId", s._id))
            .collect();

          // Count chapters
          const chapters = await ctx.db
            .query("storybookChapters")
            .withIndex("by_storybookId", (q) => q.eq("storybookId", s._id))
            .collect();

          // Latest export job
          const exportJobs = await ctx.db
            .query("exportJobs")
            .withIndex("by_storybookId_createdAt", (q) => q.eq("storybookId", s._id))
            .order("desc")
            .take(1);
          const latestExport = exportJobs[0] ?? null;

          return {
            id: s._id as string,
            title: s.title,
            status: s.status,
            bookMode: s.bookMode,
            templateId: s.templateId ?? null,
            flowStatus: s.flowStatus ?? null,
            pageCount: pages.length,
            chapterCount: chapters.length,
            latestExportStatus: latestExport?.status ?? null,
            latestExportError: latestExport?.errorMessage ?? null,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
          };
        })
    );

    // Auth providers (safe subset)
    const providers = user.authProvidersLinked ?? {};
    const linkedProviders: string[] = [];
    if ((providers as Record<string, boolean>).google) linkedProviders.push("google");
    if ((providers as Record<string, boolean>).password) linkedProviders.push("password");
    if ((providers as Record<string, boolean>).otp) linkedProviders.push("otp");
    if ((providers as Record<string, boolean>).magic_link) linkedProviders.push("magic_link");

    return {
      id: user.authSubject,
      displayName: user.display_name ?? null,
      email: user.primaryEmail ?? user.email ?? null,
      accountStatus: user.deletionStatus ?? "active",
      onboardingCompleted: user.onboarding_completed,
      onboardingGoal: user.onboarding_goal ?? null,
      authProviders: linkedProviders,
      emailVerifiedAt: user.emailVerifiedAt ?? null,
      lastActivityAt: user.lastActivityAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      projects: projectSummaries,
    };
  },
});

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

/** Get a single project with support metadata. */
export const getProjectDetail = queryGeneric({
  args: { projectId: v.string() },
  handler: async (ctx, args) => {
    const storybook = await ctx.db.get(args.projectId as never);
    if (!storybook) return null;

    // Owner lookup
    const owner = await ctx.db
      .query("users")
      .withIndex("by_auth_subject", (q) => q.eq("authSubject", storybook.ownerId))
      .unique();

    // Pages
    const pages = await ctx.db
      .query("pages")
      .withIndex("by_storybookId_orderIndex", (q) => q.eq("storybookId", storybook._id))
      .collect();

    // Chapters
    const chapters = await ctx.db
      .query("storybookChapters")
      .withIndex("by_storybookId", (q) => q.eq("storybookId", storybook._id))
      .collect();

    // Chapter answers count
    const answers = await ctx.db
      .query("chapterAnswers")
      .withIndex("by_storybookId", (q) => q.eq("storybookId", storybook._id))
      .collect();

    // Frames count
    const frames = await ctx.db
      .query("frames")
      .withIndex("by_storybookId", (q) => q.eq("storybookId", storybook._id))
      .collect();

    // Export jobs (latest 5)
    const exportJobs = await ctx.db
      .query("exportJobs")
      .withIndex("by_storybookId_createdAt", (q) => q.eq("storybookId", storybook._id))
      .order("desc")
      .take(5);

    // Settings (safe subset)
    const settings = storybook.settings as Record<string, unknown> | undefined;

    return {
      id: storybook._id as string,
      title: storybook.title,
      subtitle: storybook.subtitle ?? null,
      status: storybook.status,
      bookMode: storybook.bookMode,
      templateId: storybook.templateId ?? null,
      flowStatus: storybook.flowStatus ?? null,
      photoStatus: storybook.photoStatus ?? null,
      orientation: settings?.orientation ?? "portrait",
      pageSize: settings?.pageSize ?? null,
      owner: owner
        ? {
            id: owner.authSubject,
            displayName: owner.display_name ?? null,
            email: owner.primaryEmail ?? owner.email ?? null,
          }
        : null,
      counts: {
        pages: pages.length,
        chapters: chapters.length,
        answers: answers.length,
        frames: frames.length,
      },
      chapterSummaries: chapters.map((ch) => ({
        id: ch._id as string,
        title: ch.title,
        chapterKey: ch.chapterKey,
        status: ch.status,
        orderIndex: ch.orderIndex,
      })),
      recentExports: exportJobs.map((e) => ({
        id: e._id as string,
        type: e.type,
        status: e.status,
        errorCode: e.errorCode ?? null,
        errorMessage: e.errorMessage ?? null,
        createdAt: e.createdAt,
      })),
      createdAt: storybook.createdAt,
      updatedAt: storybook.updatedAt,
    };
  },
});
