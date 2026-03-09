import { fireEvent, render, screen } from "@testing-library/react";
import {
  buildAdminTemplateLayoutBuilderLoadResponse,
  buildAdminTemplateLayoutPreview,
} from "../../../../packages/shared/admin/templateLayoutBuilder";
import type { TemplateLayoutDefinition } from "../../../../packages/shared/templates/layoutTypes";
import { TemplateLayoutBuilderShell } from "../../components/admin/TemplateLayoutBuilderShell";

function buildLayoutDefinition(): TemplateLayoutDefinition {
  return {
    layoutSchemaVersion: 1 as const,
    pageLayouts: [
      {
        pageLayoutId: "story_primary",
        name: "Story Primary",
        description: "Primary editorial page",
        pageRole: "story_page" as const,
        sizePreset: "BOOK_8_5X11" as const,
        supportedOrientations: ["portrait"],
        slots: [
          {
            slotId: "text_slot",
            kind: "text" as const,
            role: "title",
            bindingKey: "chapterTitle",
            x: 60,
            y: 64,
            w: 400,
            h: 96,
            zIndex: 1,
            overflowBehavior: "shrink_to_fit" as const,
            alignment: "left" as const,
          },
          {
            slotId: "image_slot",
            kind: "image" as const,
            role: "image",
            bindingKey: "primaryImage",
            x: 60,
            y: 188,
            w: 420,
            h: 300,
            zIndex: 2,
            imageFit: "cover" as const,
          },
        ],
      },
    ],
    chapterPagePlans: [
      {
        chapterKey: "chapter_1",
        pages: [{ pageLayoutId: "story_primary", pageRole: "story_page" as const }],
      },
    ],
  };
}

function buildProps(canManage: boolean) {
  const layoutDefinition = buildLayoutDefinition();
  const initialData = buildAdminTemplateLayoutBuilderLoadResponse({
    templateId: "tpl_1",
    templateName: "Template One",
    templateStatus: canManage ? "published" : "draft",
    canManage,
    lastSavedAt: Date.UTC(2026, 2, 9, 14, 15, 0),
    publishedVersionRef: canManage ? "template:tpl_1:v5" : null,
    layoutDefinition,
    selectedLayoutId: "story_primary",
  });
  const initialPreview = buildAdminTemplateLayoutPreview(
    layoutDefinition,
    "story_primary",
    "sample_content"
  );
  return { initialData, initialPreview };
}

describe("TemplateLayoutBuilderShell", () => {
  it("supports layout creation and richer slot editing in editable mode", () => {
    render(<TemplateLayoutBuilderShell {...buildProps(true)} />);

    fireEvent.click(screen.getByRole("button", { name: "New layout" }));
    expect(screen.getAllByText("New layout").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "+ Text" }));
    expect(screen.getByLabelText("Slot id")).toHaveValue("text_slot_2");

    fireEvent.click(screen.getByRole("button", { name: /image_slot.*z2/i }));
    fireEvent.change(screen.getByLabelText("Caption slot"), { target: { value: "text_slot" } });
    fireEvent.change(screen.getByLabelText("Fit"), { target: { value: "contain" } });

    expect(screen.getByLabelText("Caption slot")).toHaveValue("text_slot");
    expect(screen.getByLabelText("Fit")).toHaveValue("contain");
  });

  it("keeps builder controls disabled in read-only mode", () => {
    render(<TemplateLayoutBuilderShell {...buildProps(false)} />);

    expect(screen.queryByRole("button", { name: "Save draft" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "New layout" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeDisabled();
    expect(screen.getByLabelText("Slot id")).toBeDisabled();
  });
});
