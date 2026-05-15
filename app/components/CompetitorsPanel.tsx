import { Competitor } from "../types";

interface Props {
  competitors: Competitor[];
}

export default function CompetitorsPanel({ competitors }: Props) {
  if (!competitors?.length) {
    return <p className="text-neutral-500 text-sm py-4">No competitor data available.</p>;
  }

  return (
    <div className="space-y-3">
      {competitors.map((c, i) => (
        <div key={i} className="rounded-lg border border-white/8 bg-white/3 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <p className="text-sm font-semibold text-white">{c.name}</p>
          </div>
          <p className="text-sm text-neutral-300 mb-2 leading-relaxed">{c.advantage}</p>
          <div className="pt-2 border-t border-white/8">
            <p className="text-xs text-neutral-500 uppercase tracking-widest font-medium mb-1">What to adopt</p>
            <p className="text-sm text-neutral-400 leading-relaxed">{c.gap}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
