"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

type StartOption = {
  id: string;
  label: string;
  desc: string;
  kind: "blank" | "template" | "gift";
  templateId?: string;
};

type StartActionState = {
  error: string | null;
};

function SubmitActionButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="mt-4 w-full justify-center">
      {children}
    </Button>
  );
}

export function StartStorybookForm({
  options,
  action
}: {
  options: StartOption[];
  action: (state: StartActionState, formData: FormData) => Promise<StartActionState>;
}) {
  const [state, formAction] = useActionState(action, { error: null });

  return (
    <div className="space-y-4">
      {state.error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {state.error}
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        {options.map((option) => (
          <Card key={option.id} className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Option</p>
            <h2 className="mt-2 text-lg font-semibold text-parchment">{option.label}</h2>
            <p className="mt-2 min-h-16 text-sm leading-7 text-white/70">{option.desc}</p>

            {option.kind === "gift" ? (
              <Link
                href="/gift"
                className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-4 text-sm font-semibold text-white hover:bg-white/[0.06]"
              >
                Go to Gift Page
              </Link>
            ) : (
              <form action={formAction}>
                <input type="hidden" name="kind" value={option.kind} />
                {option.templateId ? (
                  <input type="hidden" name="templateId" value={option.templateId} />
                ) : null}
                <SubmitActionButton>
                  {option.kind === "blank" ? "Create Blank Storybook" : "Use Template"}
                </SubmitActionButton>
              </form>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

