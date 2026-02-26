/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai_chapterDrafts from "../ai/chapterDrafts.js";
import type * as ai_chapterDrafts_v2 from "../ai/chapterDrafts_v2.js";
import type * as ai_entitiesExtractor from "../ai/entitiesExtractor.js";
import type * as ai_rateLimit from "../ai/rateLimit.js";
import type * as assets from "../assets.js";
import type * as authz from "../authz.js";
import type * as blocks from "../blocks.js";
import type * as chapterAnswers from "../chapterAnswers.js";
import type * as chapterDrafts from "../chapterDrafts.js";
import type * as chapterEntityOverrides from "../chapterEntityOverrides.js";
import type * as chapterIllustrations from "../chapterIllustrations.js";
import type * as chapterStudioState from "../chapterStudioState.js";
import type * as chapters from "../chapters.js";
import type * as env from "../env.js";
import type * as exports from "../exports.js";
import type * as frames from "../frames.js";
import type * as illustrate_cacheAssets from "../illustrate/cacheAssets.js";
import type * as illustrate_fetchCandidates from "../illustrate/fetchCandidates.js";
import type * as illustrate_providers from "../illustrate/providers.js";
import type * as illustrate_scoring from "../illustrate/scoring.js";
import type * as illustrate_selectForSlots from "../illustrate/selectForSlots.js";
import type * as illustrate_themeGenerator from "../illustrate/themeGenerator.js";
import type * as mediaAssets from "../mediaAssets.js";
import type * as pages from "../pages.js";
import type * as storybookChapters from "../storybookChapters.js";
import type * as storybooks from "../storybooks.js";
import type * as stt from "../stt.js";
import type * as studioDocs from "../studioDocs.js";
import type * as studioPopulate from "../studioPopulate.js";
import type * as templateSeeds from "../templateSeeds.js";
import type * as templates from "../templates.js";
import type * as users from "../users.js";
import type * as waitlist from "../waitlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "ai/chapterDrafts": typeof ai_chapterDrafts;
  "ai/chapterDrafts_v2": typeof ai_chapterDrafts_v2;
  "ai/entitiesExtractor": typeof ai_entitiesExtractor;
  "ai/rateLimit": typeof ai_rateLimit;
  assets: typeof assets;
  authz: typeof authz;
  blocks: typeof blocks;
  chapterAnswers: typeof chapterAnswers;
  chapterDrafts: typeof chapterDrafts;
  chapterEntityOverrides: typeof chapterEntityOverrides;
  chapterIllustrations: typeof chapterIllustrations;
  chapterStudioState: typeof chapterStudioState;
  chapters: typeof chapters;
  env: typeof env;
  exports: typeof exports;
  frames: typeof frames;
  "illustrate/cacheAssets": typeof illustrate_cacheAssets;
  "illustrate/fetchCandidates": typeof illustrate_fetchCandidates;
  "illustrate/providers": typeof illustrate_providers;
  "illustrate/scoring": typeof illustrate_scoring;
  "illustrate/selectForSlots": typeof illustrate_selectForSlots;
  "illustrate/themeGenerator": typeof illustrate_themeGenerator;
  mediaAssets: typeof mediaAssets;
  pages: typeof pages;
  storybookChapters: typeof storybookChapters;
  storybooks: typeof storybooks;
  stt: typeof stt;
  studioDocs: typeof studioDocs;
  studioPopulate: typeof studioPopulate;
  templateSeeds: typeof templateSeeds;
  templates: typeof templates;
  users: typeof users;
  waitlist: typeof waitlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
