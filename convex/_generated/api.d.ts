/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assets from "../assets.js";
import type * as authz from "../authz.js";
import type * as blocks from "../blocks.js";
import type * as chapters from "../chapters.js";
import type * as exports from "../exports.js";
import type * as frames from "../frames.js";
import type * as pages from "../pages.js";
import type * as storybooks from "../storybooks.js";
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
  assets: typeof assets;
  authz: typeof authz;
  blocks: typeof blocks;
  chapters: typeof chapters;
  exports: typeof exports;
  frames: typeof frames;
  pages: typeof pages;
  storybooks: typeof storybooks;
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
