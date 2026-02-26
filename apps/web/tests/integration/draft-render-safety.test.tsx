import { render, screen } from "@testing-library/react";
import { DraftSectionCard } from "../../components/draft/DraftSectionCard";

describe("Draft UI render safety", () => {
  it("renders only section text and never internal guidance", () => {
    render(
      <DraftSectionCard
        section={{
          sectionId: "intro",
          title: "Opening",
          guidance: "Write as the storyteller. Do not include this.",
          text: "The memory opens with the smell of rain on the front steps.",
          wordCount: 12,
          citations: ["q_intro"]
        }}
        canRegen={false}
      />
    );

    expect(screen.getByText(/The memory opens with the smell of rain/i)).toBeInTheDocument();
    expect(screen.queryByText(/Write as the storyteller/i)).not.toBeInTheDocument();
    expect(screen.getByText(/q_intro/)).toBeInTheDocument();
  });
});

