type UserMessageMap = Record<string, string>;

const USER_MESSAGE_BY_CODE: UserMessageMap = {
  RATE_LIMIT: "Too many requests right now. Please wait a minute and try again.",
  PROVIDER_RATE_LIMIT: "Voice transcription is busy right now. Please try again in a moment.",
  DRAFT_NOT_READY: "Your chapter draft is still preparing. Please try again shortly.",
  ILLUSTRATIONS_NOT_READY: "Illustrations are still being prepared. Please try again shortly.",
  CHAPTER_NOT_COMPLETED: "Please finish this chapter before continuing.",
  NO_ANSWERS: "No usable answers were found yet for this chapter.",
  INVALID_SECTION: "That section could not be updated. Please try again.",
  GENERATION_EMPTY: "Draft generation returned empty content. Please try again.",
  PROVIDER_ERROR: "Our AI service had a temporary issue. Please try again.",
  AUTO_ILLUSTRATE_FAILED: "Could not generate illustrations right now. Please try again.",
  NO_CANDIDATES: "No suitable images were found. Try a different prompt or try again.",
  POPULATE_FAILED: "We could not prepare the Studio chapter just now. Please retry.",
  EXPORT_RATE_LIMITED: "Export is temporarily rate limited. Please retry in a moment.",
  EXPORT_VALIDATION_FAILED: "Export found issues that need attention before generating a PDF.",
  EXPORT_RENDER_FAILED: "PDF export failed. Please retry after a moment.",
  EXPORT_INTERNAL: "Export is currently unavailable. Please try again.",
  EXPORT_FORBIDDEN: "You do not have access to export this storybook.",
  generation_failed: "Draft generation failed. Please try again.",
  regen_failed: "Section regeneration failed. Please try again.",
  approve_failed: "Could not approve the draft. Please try again.",
  entity_override_failed: "Could not save entity changes. Please try again.",
  LOCK_FAILED: "Could not update slot lock state. Please try again.",
  REPLACE_FAILED: "Could not replace that image slot. Please try again.",
  SEARCH_FAILED: "Could not load replacement search results. Please try again.",
  UPLOAD_FAILED: "Could not upload and apply your image. Please try again.",
  UPLOAD_NOT_FOUND: "The selected uploaded image could not be found.",
  missing_required: "Please answer or skip each required question before finishing this chapter.",
  answer_or_skip: "Please answer this question or tap Skip to continue.",
  save_failed: "Could not save your answer. Please try again.",
  complete_failed: "Could not complete this chapter yet. Please try again."
};

export function mapErrorCodeToUserMessage(errorCode: string | null | undefined, fallback?: string) {
  if (!errorCode) return fallback ?? "Something went wrong. Please try again.";
  return USER_MESSAGE_BY_CODE[errorCode] ?? fallback ?? "Something went wrong. Please try again.";
}
