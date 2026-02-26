import type { ChapterEntityOverrides } from "../../../../packages/shared/entities/entitiesTypes";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

export function EntityOverridesEditor({
  overrides,
  addAction,
  removeEntityAction,
  undoRemoveAction,
  resetAction
}: {
  overrides: ChapterEntityOverrides | null;
  addAction: (formData: FormData) => Promise<void>;
  removeEntityAction: (formData: FormData) => Promise<void>;
  undoRemoveAction: (formData: FormData) => Promise<void>;
  resetAction: () => Promise<void>;
}) {
  const removes = overrides?.removes ?? [];
  const addedPeople = overrides?.adds.people ?? [];
  const addedPlaces = overrides?.adds.places ?? [];
  const addedDates = overrides?.adds.dates ?? [];

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-white/45">Entity Overrides (Optional)</p>
          <p className="mt-1 text-xs text-white/55">Remove wrong entities or add missing ones. Overrides persist across regenerate.</p>
        </div>
        <form action={resetAction}>
          <Button type="submit" variant="ghost" size="sm">
            Reset Overrides
          </Button>
        </form>
      </div>

      <form action={addAction} className="mt-4 grid gap-2 sm:grid-cols-[120px_1fr_120px]">
        <select
          name="kind"
          defaultValue="places"
          className="h-10 rounded-xl border border-white/15 bg-white/[0.03] px-3 text-sm text-white"
        >
          <option value="people">Person/Role</option>
          <option value="places">Place</option>
          <option value="dates">Date</option>
        </select>
        <input
          name="value"
          placeholder="Add missing entity (e.g., Maharashtra)"
          className="h-10 rounded-xl border border-white/15 bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/35"
        />
        <Button type="submit" variant="secondary" size="md">
          Add Override
        </Button>
      </form>

      <form action={removeEntityAction} className="mt-2 grid gap-2 sm:grid-cols-[120px_1fr_120px]">
        <select
          name="kind"
          defaultValue="people"
          className="h-10 rounded-xl border border-white/15 bg-white/[0.03] px-3 text-sm text-white"
        >
          <option value="people">Person/Role</option>
          <option value="places">Place</option>
          <option value="dates">Date</option>
        </select>
        <input
          name="value"
          placeholder="Remove wrong entity (e.g., The)"
          className="h-10 rounded-xl border border-white/15 bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/35"
        />
        <Button type="submit" variant="ghost" size="md">
          Remove Entity
        </Button>
      </form>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="text-white/65">Added people/roles: {addedPeople.map((row) => row.value).join(", ") || "None"}</p>
          <p className="text-white/65">Added places: {addedPlaces.map((row) => row.value).join(", ") || "None"}</p>
          <p className="text-white/65">Added dates: {addedDates.map((row) => row.value).join(", ") || "None"}</p>
        </div>

        <div>
          <p className="mb-2 text-white/70">Removed entities</p>
          {removes.length === 0 ? (
            <p className="text-white/50">None</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {removes.map((item) => (
                <form key={`${item.kind}:${item.value}`} action={undoRemoveAction}>
                  <input type="hidden" name="kind" value={item.kind} />
                  <input type="hidden" name="value" value={item.value} />
                  <Button type="submit" variant="ghost" size="sm">
                    Undo remove: {item.kind}:{item.value}
                  </Button>
                </form>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
