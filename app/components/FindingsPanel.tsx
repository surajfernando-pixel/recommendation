import { Finding, Severity } from "../types";

interface Props {
  findings: Finding[];
}

const badgeStyles: Record<Severity, string> = {
  critical: "bg-red-500/15 text-red-400 border border-red-500/20",
  warning: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  good: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  info: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
};

export default function FindingsPanel({ findings }: Props) {
  if (!findings?.length) {
    return <p className="text-neutral-500 text-sm py-4">No findings available.</p>;
  }

  return (
    <div className="space-y-3">
      {findings.map((f, i) => (
        <div
          key={i}
          className="rounded-lg border border-white/8 bg-white/3 p-4 hover:bg-white/5 transition"
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${badgeStyles[f.severity]}`}
            >
              {f.severity}
            </span>
            <div>
              <p className="text-sm font-medium text-white mb-1">{f.title}</p>
              <p className="text-sm text-neutral-400 leading-relaxed">{f.detail}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
