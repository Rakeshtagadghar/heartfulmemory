export type FlowStateKind =
  | "needs_questions"
  | "needs_extra_question"
  | "needs_upload_photos"
  | "populating"
  | "ready_in_studio"
  | "error";

export type ExtraAnswerStatus = "pending" | "answered" | "skipped";
export type PhotoStatus = "not_started" | "done" | "skipped";

export type DeriveNextStepInput = {
  storybookId: string;
  /** All chapter instances for the storybook, ordered by orderIndex */
  chapters: Array<{ id: string; status: "not_started" | "in_progress" | "completed" }>;
  extraAnswerStatus: ExtraAnswerStatus;
  photoStatus: PhotoStatus;
  flowStatus: FlowStateKind | null | undefined;
};

export type NextStepRoute =
  | { state: "needs_questions"; href: string; chapterInstanceId: string }
  | { state: "needs_extra_question"; href: string }
  | { state: "needs_upload_photos"; href: string }
  | { state: "populating"; href: null }
  | { state: "ready_in_studio"; href: string }
  | { state: "error"; href: null };
