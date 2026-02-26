import { Card } from "../ui/card";

type WarningRow = {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
  sectionId?: string;
};

function severityClass(severity: WarningRow["severity"]) {
  if (severity === "error") return "border-rose-300/25 bg-rose-400/10 text-rose-100";
  if (severity === "warning") return "border-amber-300/25 bg-amber-400/10 text-amber-100";
  return "border-cyan-300/25 bg-cyan-400/10 text-cyan-100";
}

export function DraftWarnings({ warnings }: { warnings: WarningRow[] }) {
  if (!warnings.length) return null;

  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-white/45">Draft Warnings</p>
      <div className="mt-3 space-y-2">
        {warnings.map((warning, index) => (
          <div key={`${warning.code}-${index}`} className={`rounded-xl border px-3 py-2 ${severityClass(warning.severity)}`}>
            <p className="text-sm font-semibold">
              {warning.code}
              {warning.sectionId ? ` (${warning.sectionId})` : ""}
            </p>
            <p className="mt-1 text-xs opacity-90">{warning.message}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

