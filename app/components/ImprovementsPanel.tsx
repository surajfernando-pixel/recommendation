import { QuickWin } from "../types";

interface Props {
  items: QuickWin[];
}

export default function ImprovementsPanel({ items }: Props) {
  if (!items?.length) {
    return <p className="text-neutral-500 text-sm py-4">No quick wins available.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg border-l-2 border-emerald-500 bg-emerald-500/5 border border-emerald-500/15 p-4"
        >
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1.5">
            {item.category}
          </p>
          <p className="text-sm text-neutral-300 leading-relaxed">{item.action}</p>
        </div>
      ))}
    </div>
  );
}
