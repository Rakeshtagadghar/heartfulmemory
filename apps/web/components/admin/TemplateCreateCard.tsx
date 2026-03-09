"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

export function TemplateCreateCard() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("book_template");
  const [visibility, setVisibility] = useState("public");
  const [category, setCategory] = useState("general");
  const [guidedLevel, setGuidedLevel] = useState("guided");
  const [supportsPortrait, setSupportsPortrait] = useState(true);
  const [supportsLandscape, setSupportsLandscape] = useState(false);
  const [supportsReflowMode, setSupportsReflowMode] = useState(false);
  const [supportsPdfExport, setSupportsPdfExport] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/templates", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          slug,
          name,
          description,
          type,
          visibility,
          category,
          guidedLevel,
          displayOrder: null,
          supportsPortrait,
          supportsLandscape,
          supportsReflowMode,
          supportsPdfExport,
        }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        data?: { templateId?: string };
        error?: { message?: string };
      };

      if (!response.ok || !payload.success || !payload.data?.templateId) {
        setError(payload.error?.message ?? "Template could not be created.");
        return;
      }

      setMessage("Template created.");
      router.push(`/admin/templates/${encodeURIComponent(payload.data.templateId)}`);
      router.refresh();
    } catch {
      setError("Template could not be created.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-sm font-medium text-white/75">Create template metadata</h2>
      <p className="mt-2 text-sm text-white/50">
        Create a draft template record. It stays unpublished until validation passes.
      </p>
      <div className="mt-4 space-y-3">
        <input
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="Slug, e.g. family_roots_alpha"
          className="w-full rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25"
        />
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Template name"
          className="w-full rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25"
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Short description"
          rows={3}
          className="w-full rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25"
        />
        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
          >
            <option value="book_template">Book template</option>
            <option value="cover_template">Cover template</option>
            <option value="page_template">Page template</option>
          </select>
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value)}
            className="rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
          >
            <option value="public">Public</option>
            <option value="alpha_only">Alpha only</option>
            <option value="internal_only">Internal only</option>
            <option value="hidden">Hidden</option>
          </select>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
          >
            <option value="family_story">Family story</option>
            <option value="childhood">Childhood</option>
            <option value="wedding">Wedding</option>
            <option value="life_journey">Life journey</option>
            <option value="memorial">Memorial</option>
            <option value="general">General</option>
            <option value="custom">Custom</option>
          </select>
          <select
            value={guidedLevel}
            onChange={(event) => setGuidedLevel(event.target.value)}
            className="rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
          >
            <option value="guided">Guided</option>
            <option value="semi_guided">Semi-guided</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/70">
            <input type="checkbox" checked={supportsPortrait} onChange={(event) => setSupportsPortrait(event.target.checked)} />
            Supports portrait
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/70">
            <input type="checkbox" checked={supportsLandscape} onChange={(event) => setSupportsLandscape(event.target.checked)} />
            Supports landscape
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/70">
            <input type="checkbox" checked={supportsReflowMode} onChange={(event) => setSupportsReflowMode(event.target.checked)} />
            Supports reflow mode
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/70">
            <input type="checkbox" checked={supportsPdfExport} onChange={(event) => setSupportsPdfExport(event.target.checked)} />
            Supports PDF export
          </label>
        </div>
      </div>
      {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
      {message ? <p className="mt-3 text-xs text-emerald-300">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-white/[0.08] px-3 py-2 text-sm text-white transition hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create draft"}
      </button>
    </form>
  );
}
