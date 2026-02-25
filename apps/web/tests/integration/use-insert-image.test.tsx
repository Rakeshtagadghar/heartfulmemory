import { renderHook, act } from "@testing-library/react";
import type { PageDTO } from "../../lib/dto/page";
import type { FrameDTO } from "../../lib/dto/frame";
import type { AssetDTO } from "../../lib/dto/asset";
import type { NormalizedStockResult } from "../../lib/stock/types";

const mockCreateFrameAction = vi.fn();

vi.mock("../../lib/actions/editor2", () => ({
  createFrameAction: (...args: unknown[]) => mockCreateFrameAction(...args)
}));

import { useInsertImage } from "../../components/editor2/hooks/useInsertImage";

function pageFixture(): PageDTO {
  return {
    id: "page_1",
    storybook_id: "sb_1",
    owner_id: "user:test@example.com",
    order_index: 0,
    size_preset: "A4",
    width_px: 800,
    height_px: 1100,
    margins: { top: 40, right: 40, bottom: 40, left: 40, unit: "px" },
    grid: { enabled: true, columns: 6, gutter: 20, rowHeight: 12, showGuides: true },
    background: { fill: "#ffffff" },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function imageFrameFixture(id = "frame_new"): FrameDTO {
  return {
    id,
    storybook_id: "sb_1",
    page_id: "page_1",
    owner_id: "user:test@example.com",
    type: "IMAGE",
    x: 100,
    y: 200,
    w: 320,
    h: 240,
    z_index: 1,
    locked: false,
    style: {},
    content: {},
    crop: null,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function uploadAssetFixture(): AssetDTO {
  return {
    id: "asset_1",
    owner_id: "user:test@example.com",
    source: "UPLOAD",
    source_asset_id: null,
    source_url: "https://example.com/upload.jpg",
    storage_provider: null,
    storage_bucket: null,
    storage_key: null,
    mime_type: "image/jpeg",
    width: 1600,
    height: 900,
    duration_seconds: null,
    size_bytes: 12345,
    checksum: null,
    license: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function stockResultFixture(): NormalizedStockResult {
  return {
    provider: "unsplash",
    assetId: "u_123",
    thumbUrl: "https://images.example/thumb.jpg",
    previewUrl: "https://images.example/preview.jpg",
    fullUrl: "https://images.example/full.jpg",
    width: 1200,
    height: 800,
    authorName: "Alex Photo",
    authorUrl: "https://example.com/alex",
    sourceUrl: "https://unsplash.com/photos/abc",
    licenseName: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    requiresAttribution: false,
    attributionText: "Photo by Alex Photo on Unsplash"
  };
}

describe("useInsertImage", () => {
  beforeEach(() => {
    mockCreateFrameAction.mockReset();
    mockCreateFrameAction.mockResolvedValue({ ok: true, data: imageFrameFixture() });
  });

  it("inserts upload asset as an image frame and captures source url", async () => {
    const { result } = renderHook(() => useInsertImage());

    await act(async () => {
      await result.current.insertFromUploadAsset({
        storybookId: "sb_1",
        page: pageFixture(),
        currentFrames: [],
        asset: uploadAssetFixture()
      });
    });

    expect(mockCreateFrameAction).toHaveBeenCalledTimes(1);
    const [, , payload] = mockCreateFrameAction.mock.calls[0] as [string, string, Record<string, unknown>];
    expect(payload.type).toBe("IMAGE");
    expect((payload.content as Record<string, unknown>).assetId).toBe("asset_1");
    expect((payload.content as Record<string, unknown>).attribution).toMatchObject({ provider: "upload" });
  });

  it("dedupes rapid repeated inserts", async () => {
    const { result } = renderHook(() => useInsertImage());
    const page = pageFixture();
    const asset = uploadAssetFixture();

    await act(async () => {
      await result.current.insertFromUploadAsset({
        storybookId: "sb_1",
        page,
        currentFrames: [],
        asset
      });
      await result.current.insertFromUploadAsset({
        storybookId: "sb_1",
        page,
        currentFrames: [],
        asset
      });
    });

    expect(mockCreateFrameAction).toHaveBeenCalledTimes(1);
  });

  it("stores provider attribution on stock insert", async () => {
    const { result } = renderHook(() => useInsertImage());
    const stockAsset = { ...uploadAssetFixture(), id: "asset_stock", source: "UNSPLASH" as const };

    await act(async () => {
      await result.current.insertFromProviderResult({
        storybookId: "sb_1",
        page: pageFixture(),
        currentFrames: [],
        asset: stockAsset,
        result: stockResultFixture()
      });
    });

    const [, , payload] = mockCreateFrameAction.mock.calls[0] as [string, string, Record<string, unknown>];
    const content = payload.content as Record<string, unknown>;
    expect(content.assetId).toBe("asset_stock");
    expect(content.attribution).toMatchObject({
      provider: "unsplash",
      authorName: "Alex Photo"
    });
  });
});
