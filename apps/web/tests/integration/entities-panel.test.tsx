import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EntitiesPanel } from "../../components/draft/EntitiesPanel";

describe("EntitiesPanel", () => {
  it("groups entities and renders citation deep links", () => {
    render(
      <EntitiesPanel
        storybookId="sb1"
        chapterInstanceId="ch1"
        entitiesV2={{
          people: [
            { value: "Mother", kind: "role", confidence: 0.9, citations: ["q_family"], source: "llm" },
            { value: "The", kind: "person", confidence: 0.9, citations: ["q_bad"], source: "llm" }
          ],
          places: [{ value: "Maharashtra", confidence: 0.95, citations: ["q_place"], source: "llm" }],
          dates: [{ value: "June 2008", normalized: "2008-06", confidence: 0.8, citations: ["q_when"], source: "llm" }],
          meta: { version: 2, generatedAt: Date.now(), generator: "llm_extractor_v2" }
        }}
      />
    );

    expect(screen.getByText("People")).toBeInTheDocument();
    expect(screen.getByText("Places")).toBeInTheDocument();
    expect(screen.getByText("Dates")).toBeInTheDocument();
    expect(screen.getByText("The")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "q_place" });
    expect(link.getAttribute("href")).toContain("/book/sb1/chapters/ch1/wizard?questionId=q_place");
  });

  it("shows extractor unavailable empty state and try again button", () => {
    render(
      <EntitiesPanel
        storybookId="sb1"
        chapterInstanceId="ch1"
        entitiesV2={null}
        warnings={[{ code: "ENTITY_EXTRACTOR_UNAVAILABLE", message: "x", severity: "warning" }]}
        retryAction={async () => {}}
      />
    );

    expect(screen.getByText(/Entity extraction is currently unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Try Again/i })).toBeInTheDocument();
  });
});
