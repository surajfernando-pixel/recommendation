import { TabId } from "../types";

interface Props {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string }[] = [
  { id: "aeo", label: "AEO findings" },
  { id: "geo", label: "GEO findings" },
  { id: "competitors", label: "Competitor gaps" },
  { id: "improvements", label: "Quick wins" },
];

export default function TabNav({ activeTab, onChange }: Props) {
  return (
    <div className="flex gap-1 mb-6 border-b border-white/10">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
            activeTab === t.id
              ? "text-white border-emerald-400"
              : "text-neutral-500 border-transparent hover:text-neutral-300"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
