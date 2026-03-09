"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  AdminTemplateDetail,
  AdminTemplateQuestion,
} from "../../../../packages/shared/admin/templates";

function createQuestionDraft(chapterKey: string, index: number): AdminTemplateQuestion {
  return {
    questionId: `${chapterKey}_question_${index + 1}`,
    prompt: "",
    helpText: null,
    required: false,
    inputType: "textarea",
    slotKey: `${chapterKey}.question_${index + 1}`,
  };
}

export function TemplateQuestionsEditor({
  template,
  canManage,
}: {
  template: AdminTemplateDetail;
  canManage: boolean;
}) {
  const router = useRouter();
  const [questionsByChapter, setQuestionsByChapter] = useState<Record<string, AdminTemplateQuestion[]>>(
    Object.fromEntries(
      template.chapters.map((chapter) => [chapter.chapterKey, chapter.questions])
    )
  );
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateQuestion(
    chapterKey: string,
    questionIndex: number,
    patch: Partial<AdminTemplateQuestion>
  ) {
    setQuestionsByChapter((current) => ({
      ...current,
      [chapterKey]: (current[chapterKey] ?? []).map((question, index) =>
        index === questionIndex ? { ...question, ...patch } : question
      ),
    }));
  }

  function addQuestion(chapterKey: string) {
    setQuestionsByChapter((current) => {
      const nextQuestions = current[chapterKey] ?? [];
      return {
        ...current,
        [chapterKey]: [...nextQuestions, createQuestionDraft(chapterKey, nextQuestions.length)],
      };
    });
  }

  function deleteQuestion(chapterKey: string, questionIndex: number) {
    setQuestionsByChapter((current) => ({
      ...current,
      [chapterKey]: (current[chapterKey] ?? []).filter((_, index) => index !== questionIndex),
    }));
  }

  async function saveQuestions() {
    setPending(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/templates/${encodeURIComponent(template.id)}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          questionsByChapter,
        }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        error?: { message?: string };
      };

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Questions could not be updated.");
        return;
      }

      setMessage("Template questions updated.");
      router.refresh();
    } catch {
      setError("Questions could not be updated.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-white/75">Guided questions</h2>
          <p className="mt-2 text-sm text-white/50">
            Edit prompts, add new questions, or remove questions from each chapter.
          </p>
        </div>
        {canManage ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => void saveQuestions()}
            className="rounded-lg bg-white/[0.08] px-3 py-2 text-sm text-white transition hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save questions"}
          </button>
        ) : null}
      </div>

      <div className="mt-4 space-y-4">
        {template.chapters.map((chapter) => {
          const questions = questionsByChapter[chapter.chapterKey] ?? [];

          return (
            <div key={chapter.chapterKey} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">{chapter.title}</p>
                  {chapter.subtitle ? <p className="mt-1 text-sm text-white/45">{chapter.subtitle}</p> : null}
                  <p className="mt-2 text-xs text-white/30">{chapter.chapterKey}</p>
                </div>
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => addQuestion(chapter.chapterKey)}
                    className="rounded-lg bg-white/[0.08] px-3 py-2 text-sm text-white transition hover:bg-white/[0.14]"
                  >
                    Add question
                  </button>
                ) : null}
              </div>

              <div className="mt-4 space-y-3">
                {questions.length === 0 ? (
                  <p className="text-sm text-white/40">No questions configured for this chapter.</p>
                ) : (
                  questions.map((question, questionIndex) => (
                    <div key={`${chapter.chapterKey}-${question.questionId}-${questionIndex}`} className="rounded-xl border border-white/8 bg-[#0a1321] p-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="text-xs text-white/45 md:col-span-2">
                          Prompt
                          <textarea
                            value={question.prompt}
                            disabled={!canManage}
                            onChange={(event) =>
                              updateQuestion(chapter.chapterKey, questionIndex, {
                                prompt: event.target.value,
                              })
                            }
                            rows={3}
                            className="mt-1 w-full rounded-lg border border-white/10 bg-[#08101d] px-3 py-2 text-sm text-white outline-none disabled:text-white/50"
                          />
                        </label>
                        <label className="text-xs text-white/45 md:col-span-2">
                          Help text
                          <textarea
                            value={question.helpText ?? ""}
                            disabled={!canManage}
                            onChange={(event) =>
                              updateQuestion(chapter.chapterKey, questionIndex, {
                                helpText: event.target.value || null,
                              })
                            }
                            rows={2}
                            className="mt-1 w-full rounded-lg border border-white/10 bg-[#08101d] px-3 py-2 text-sm text-white outline-none disabled:text-white/50"
                          />
                        </label>
                        <label className="text-xs text-white/45">
                          Question id
                          <input
                            value={question.questionId}
                            disabled={!canManage}
                            onChange={(event) =>
                              updateQuestion(chapter.chapterKey, questionIndex, {
                                questionId: event.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-white/10 bg-[#08101d] px-3 py-2 text-sm text-white outline-none disabled:text-white/50"
                          />
                        </label>
                        <label className="text-xs text-white/45">
                          Slot key
                          <input
                            value={question.slotKey ?? ""}
                            disabled={!canManage}
                            onChange={(event) =>
                              updateQuestion(chapter.chapterKey, questionIndex, {
                                slotKey: event.target.value || null,
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-white/10 bg-[#08101d] px-3 py-2 text-sm text-white outline-none disabled:text-white/50"
                          />
                        </label>
                        <label className="text-xs text-white/45">
                          Input type
                          <select
                            value={question.inputType ?? "textarea"}
                            disabled={!canManage}
                            onChange={(event) =>
                              updateQuestion(chapter.chapterKey, questionIndex, {
                                inputType: event.target.value as "text" | "textarea",
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-white/10 bg-[#08101d] px-3 py-2 text-sm text-white outline-none disabled:text-white/50"
                          >
                            <option value="textarea">Textarea</option>
                            <option value="text">Text</option>
                          </select>
                        </label>
                        <label className="flex items-center gap-2 self-end rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/70">
                          <input
                            type="checkbox"
                            checked={question.required}
                            disabled={!canManage}
                            onChange={(event) =>
                              updateQuestion(chapter.chapterKey, questionIndex, {
                                required: event.target.checked,
                              })
                            }
                          />
                          Required
                        </label>
                      </div>

                      {canManage ? (
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => deleteQuestion(chapter.chapterKey, questionIndex)}
                            className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100 transition hover:bg-rose-500/30"
                          >
                            Delete question
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
      {message ? <p className="mt-3 text-xs text-emerald-300">{message}</p> : null}
    </section>
  );
}
