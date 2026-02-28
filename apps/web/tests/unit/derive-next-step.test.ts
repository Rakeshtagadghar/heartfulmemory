import { describe, expect, it } from "vitest";
import { deriveNextStep } from "../../lib/flow/deriveNextStep";
import type { DeriveNextStepInput } from "../../../../packages/shared/flow/flowTypes";

const SB = "sb_123";

const allCompleted: DeriveNextStepInput["chapters"] = [
  { id: "ch_1", status: "completed" },
  { id: "ch_2", status: "completed" }
];

const hasIncomplete: DeriveNextStepInput["chapters"] = [
  { id: "ch_1", status: "completed" },
  { id: "ch_2", status: "in_progress" }
];

function input(overrides: Partial<DeriveNextStepInput>): DeriveNextStepInput {
  return {
    storybookId: SB,
    chapters: allCompleted,
    extraAnswerStatus: "answered",
    photoStatus: "done",
    flowStatus: null,
    ...overrides
  };
}

describe("deriveNextStep", () => {
  it("routes to wizard when a chapter is incomplete", () => {
    const result = deriveNextStep(input({ chapters: hasIncomplete, extraAnswerStatus: "pending", photoStatus: "not_started" }));
    expect(result.state).toBe("needs_questions");
    expect(result.href).toContain("/chapters/ch_2/wizard");
  });

  it("routes to extra question when all chapters done but extra is pending", () => {
    const result = deriveNextStep(input({ extraAnswerStatus: "pending", photoStatus: "not_started" }));
    expect(result.state).toBe("needs_extra_question");
    expect(result.href).toBe(`/book/${SB}/extra`);
  });

  it("routes to photos when extra is answered and photos not started", () => {
    const result = deriveNextStep(input({ extraAnswerStatus: "answered", photoStatus: "not_started" }));
    expect(result.state).toBe("needs_upload_photos");
    expect(result.href).toBe(`/book/${SB}/photos`);
  });

  it("routes to photos when extra is skipped and photos not started", () => {
    const result = deriveNextStep(input({ extraAnswerStatus: "skipped", photoStatus: "not_started" }));
    expect(result.state).toBe("needs_upload_photos");
    expect(result.href).toBe(`/book/${SB}/photos`);
  });

  it("routes to studio when photos are done", () => {
    const result = deriveNextStep(input({ photoStatus: "done" }));
    expect(result.state).toBe("ready_in_studio");
    expect(result.href).toBe(`/studio/${SB}`);
  });

  it("routes to studio when photos are skipped", () => {
    const result = deriveNextStep(input({ photoStatus: "skipped" }));
    expect(result.state).toBe("ready_in_studio");
    expect(result.href).toBe(`/studio/${SB}`);
  });

  it("returns populating state when flowStatus is populating", () => {
    const result = deriveNextStep(input({ flowStatus: "populating" }));
    expect(result.state).toBe("populating");
    expect(result.href).toBeNull();
  });

  it("returns ready_in_studio when flowStatus is ready_in_studio (overrides chapters check)", () => {
    const result = deriveNextStep(input({ chapters: hasIncomplete, flowStatus: "ready_in_studio" }));
    expect(result.state).toBe("ready_in_studio");
    expect(result.href).toBe(`/studio/${SB}`);
  });

  it("returns error state when flowStatus is error", () => {
    const result = deriveNextStep(input({ flowStatus: "error" }));
    expect(result.state).toBe("error");
    expect(result.href).toBeNull();
  });

  it("routes to first incomplete chapter (not second)", () => {
    const chapters: DeriveNextStepInput["chapters"] = [
      { id: "ch_1", status: "not_started" },
      { id: "ch_2", status: "not_started" }
    ];
    const result = deriveNextStep(input({ chapters }));
    expect(result.state).toBe("needs_questions");
    if (result.state === "needs_questions") {
      expect(result.chapterInstanceId).toBe("ch_1");
    }
  });
});
