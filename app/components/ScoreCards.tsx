interface Props {
  scores: { aeo: number; geo: number; overall: number };
}

function scoreColor(n: number) {
  if (n >= 70) return "text-emerald-400";
  if (n >= 45) return "text-amber-400";
  return "text-red-400";
}

function scoreRing(n: number) {
  if (n >= 70) return "bg-emerald-500/10 border-emerald-500/30";
  if (n >= 45) return "bg-amber-500/10 border-amber-500/30";
  return "bg-red-500/10 border-red-500/30";
}

function scoreLabel(n: number) {
  if (n >= 70) return "Strong";
  if (n >= 45) return "Needs work";
  return "Poor";
}

export default function ScoreCards({ scores }: Props) {
  const cards = [
    { label: "Overall", value: scores.overall, sub: "AEO + GEO combined" },
    { label: "AEO", value: scores.aeo, sub: "Answer engine readiness" },
    { label: "GEO", value: scores.geo, sub: "Generative engine readiness" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-xl border p-4 ${scoreRing(c.value)}`}
        >
          <p className="text-xs text-neutral-500 mb-2 font-medium uppercase tracking-widest">
            {c.label}
          </p>
          <p className={`text-3xl font-semibold leading-none mb-1 ${scoreColor(c.value)}`}>
            {c.value}
            <span className="text-base font-normal text-neutral-600">/100</span>
          </p>
          <p className="text-xs text-neutral-500">{scoreLabel(c.value)} — {c.sub}</p>
        </div>
      ))}
    </div>
  );
}
