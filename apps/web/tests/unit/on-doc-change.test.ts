import { describe, expect, it } from "vitest";
import {
  listTouchedChapterKeysFromDocChange,
  readStudioPopulateMetaFromContent,
  shouldPromoteChapterStatusToEdited
} from "../../../../packages/editor/events/onDocChange";

describe("onDocChange helpers", () => {
  it("extracts studio populate metadata safely from frame content", () => {
    const meta = readStudioPopulateMetaFromContent({
      kind: "text_frame_v1",
      populateMeta: {
        source: "studio_populate_v1",
        chapterKey: "origins",
        slotId: "body",
        pageTemplateId: "chapter_main_v1"
      }
    });

    expect(meta).toEqual({
      source: "studio_populate_v1",
      chapterKey: "origins",
      slotId: "body",
      pageTemplateId: "chapter_main_v1",
      stableNodeKey: undefined
    });
  });

  it("dedupes touched chapter keys from changed nodes", () => {
    const chapterKeys = listTouchedChapterKeysFromDocChange([
      {
        id: "f1",
        content: { populateMeta: { source: "studio_populate_v1", chapterKey: "origins" } }
      },
      {
        id: "f2",
        content: { populateMeta: { source: "studio_populate_v1", chapterKey: "origins" } }
      },
      {
        id: "f3",
        content: { populateMeta: { source: "studio_populate_v1", chapterKey: "school" } }
      },
      { id: "f4", content: { populateMeta: { source: "manual", chapterKey: "other" } } }
    ]);

    expect(chapterKeys).toEqual(["origins", "school"]);
  });

  it("only promotes populated chapters to edited on user-origin changes", () => {
    expect(shouldPromoteChapterStatusToEdited({ currentStatus: "populated", changeOrigin: "user" })).toBe(true);
    expect(shouldPromoteChapterStatusToEdited({ currentStatus: "edited", changeOrigin: "user" })).toBe(false);
    expect(shouldPromoteChapterStatusToEdited({ currentStatus: "finalized", changeOrigin: "user" })).toBe(false);
    expect(shouldPromoteChapterStatusToEdited({ currentStatus: "populated", changeOrigin: "populate" })).toBe(false);
  });
});

