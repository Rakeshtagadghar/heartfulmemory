import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NarrationSettings } from "../../components/create/NarrationSettings";

describe("NarrationSettings", () => {
  it("uses sprint defaults when narration is missing", () => {
    render(<NarrationSettings narration={null} action={vi.fn(async () => {})} />);

    expect(screen.getByLabelText(/voice/i)).toHaveValue("third_person");
    expect(screen.getByLabelText(/tense/i)).toHaveValue("past");
    expect(screen.getByLabelText(/tone/i)).toHaveValue("warm");
    expect(screen.getByLabelText(/length/i)).toHaveValue("medium");
  });

  it("renders provided narration values", () => {
    render(
      <NarrationSettings
        narration={{
          voice: "first_person",
          tense: "present",
          tone: "poetic",
          length: "long"
        }}
        action={vi.fn(async () => {})}
      />
    );

    expect(screen.getByLabelText(/voice/i)).toHaveValue("first_person");
    expect(screen.getByLabelText(/tense/i)).toHaveValue("present");
    expect(screen.getByLabelText(/tone/i)).toHaveValue("poetic");
    expect(screen.getByLabelText(/length/i)).toHaveValue("long");
  });
});

