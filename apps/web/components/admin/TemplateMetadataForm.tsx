"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import type { AdminTemplateDetail } from "../../../../packages/shared/admin/templates";

export function TemplateMetadataForm({ template }: { template: AdminTemplateDetail }) {
  const router = useRouter();
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? "");
  const [type, setType] = useState(template.type);
  const [visibility, setVisibility] = useState(template.visibility);
  const [category, setCategory] = useState(template.category);
  const [guidedLevel, setGuidedLevel] = useState(template.guidedLevel);
  const [displayOrder, setDisplayOrder] = useState(template.displayOrder ? String(template.displayOrder) : "");
  const [supportsPortrait, setSupportsPortrait] = useState(template.compatibility.supportsPortrait === true);
  const [supportsLandscape, setSupportsLandscape] = useState(template.compatibility.supportsLandscape === true);
  const [supportsReflowMode, setSupportsReflowMode] = useState(template.compatibility.supportsReflowMode === true);
  const [supportsPdfExport, setSupportsPdfExport] = useState(template.compatibility.supportsPdfExport === true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
          name,
          description,
          type,
          visibility,
          category,
          guidedLevel,
          displayOrder: displayOrder ? Number(displayOrder) : null,
          supportsPortrait,
          supportsLandscape,
          supportsReflowMode,
          supportsPdfExport,
        }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        error?: { message?: string };
      };

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Template could not be updated.");
        return;
      }

      setMessage("Template metadata updated.");
      router.refresh();
    } catch {
      setError("Template could not be updated.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-sm font-medium text-white/75">Edit metadata</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-xs text-white/45">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
          />
        </label>
        <label className="text-xs text-white/45">
          Slug
          <input
            value={template.slug}
            disabled
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white/45 outline-none"
          />
        </label>
        <label className="md:col-span-2 text-xs text-white/45">
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
          />
        </label>
        <label className="text-xs text-white/45">
          Type
          <select
            value={type}
            onChange={(event) => setType(event.target.value as typeof type)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
          >
            <option value="book_template">Book template</option>
            <option value="cover_template">Cover template</option>
            <option value="page_template">Page template</option>
          </select>
        </label>
        <label className="text-xs text-white/45">
          Visibility
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as typeof visibility)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
          >
            <option value="public">Public</option>
            <option value="alpha_only">Alpha only</option>
            <option value="internal_only">Internal only</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
        <label className="text-xs text-white/45">
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as typeof category)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
          >
            <option value="family_story">Family story</option>
            <option value="childhood">Childhood</option>
            <option value="wedding">Wedding</option>
            <option value="life_journey">Life journey</option>
            <option value="memorial">Memorial</option>
            <option value="general">General</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label className="text-xs text-white/45">
          Guided level
          <select
            value={guidedLevel}
            onChange={(event) => setGuidedLevel(event.target.value as typeof guidedLevel)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
          >
            <option value="guided">Guided</option>
            <option value="semi_guided">Semi-guided</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>
        <label className="text-xs text-white/45">
          Display order
          <input
            type="number"
            min={1}
            value={displayOrder}
            onChange={(event) => setDisplayOrder(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a1321] px-3 py-2 text-sm text-white outline-none"
          />
        </label>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
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
      {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
      {message ? <p className="mt-3 text-xs text-emerald-300">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-white/[0.08] px-3 py-2 text-sm text-white transition hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save metadata"}
      </button>
    </form>
  );
}
