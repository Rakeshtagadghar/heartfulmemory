import { filterHiddenPagesFromExport } from "../../../../packages/pdf/renderers/filterPages";

describe("hidden export policy", () => {
  const pages = [{ id: "p1", is_hidden: false }, { id: "p2", is_hidden: true }];
  const frames = [
    { id: "f1", page_id: "p1" },
    { id: "f2", page_id: "p2" }
  ];

  it("excludes hidden pages by default", () => {
    const result = filterHiddenPagesFromExport({
      pages,
      frames,
      includeHiddenPages: false,
      settings: {}
    });
    expect(result.pages.map((page) => page.id)).toEqual(["p1"]);
    expect(result.frames.map((frame) => frame.id)).toEqual(["f1"]);
  });

  it("keeps hidden pages when explicit include flag is enabled", () => {
    const result = filterHiddenPagesFromExport({
      pages,
      frames,
      includeHiddenPages: true,
      settings: {}
    });
    expect(result.pages.map((page) => page.id)).toEqual(["p1", "p2"]);
    expect(result.frames.map((frame) => frame.id)).toEqual(["f1", "f2"]);
  });
});
