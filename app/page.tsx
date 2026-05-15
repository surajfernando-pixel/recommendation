"use client";

import { useState } from "react";
import { AnalysisResult, TabId } from "./types";
import ScoreCards from "./components/ScoreCards";
import TabNav from "./components/TabNav";
import FindingsPanel from "./components/FindingsPanel";
import CompetitorsPanel from "./components/CompetitorsPanel";
import ImprovementsPanel from "./components/ImprovementsPanel";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("aeo");

  async function runAnalysis() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    setResult(null);
    setStatusMsg("Fetching and analysing site content...");

    const msgs = [
      "Searching for competitors in the industry...",
      "Evaluating AEO signals...",
      "Evaluating GEO signals...",
      "Generating recommendations...",
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < msgs.length) setStatusMsg(msgs[i++]);
    }, 4000);

    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
      setActiveTab("aeo");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      clearInterval(interval);
      setLoading(false);
      setStatusMsg("");
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center text-black text-xs font-bold">
              AG
            </div>
            <span className="font-medium text-sm tracking-tight">AEO + GEO Analyser</span>
          </div>
          <span className="text-xs text-neutral-500">Powered by Claude + web search</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {!result && !loading && (
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-semibold tracking-tight mb-3">
              Optimise for AI-powered search
            </h1>
            <p className="text-neutral-400 text-base max-w-xl mx-auto leading-relaxed">
              Analyse any website for Answer Engine Optimisation (AEO) and Generative Engine Optimisation (GEO),
              with competitor benchmarking and actionable quick wins.
            </p>
          </div>
        )}

        <div className="flex gap-3 mb-8">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runAnalysis()}
            placeholder="https://example.com"
            disabled={loading}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition disabled:opacity-50"
          />
          <button
            onClick={runAnalysis}
            disabled={loading || !url.trim()}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black text-sm font-semibold rounded-lg transition whitespace-nowrap"
          >
            {loading ? "Analysing..." : "Analyse →"}
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg mb-8 text-sm text-neutral-400">
            <svg className="animate-spin w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            {statusMsg}
          </div>
        )}

        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm mb-8">
            {error}
          </div>
        )}

        {result && (
          <div>
            <div className="mb-6 px-4 py-3 bg-white/5 rounded-lg text-sm text-neutral-300 leading-relaxed border border-white/5">
              <span className="text-neutral-500 text-xs uppercase tracking-widest font-medium mr-2">Site</span>
              {result.site_summary}
            </div>

            <ScoreCards scores={result.scores} />
            <TabNav activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === "aeo" && <FindingsPanel findings={result.aeo_findings} />}
            {activeTab === "geo" && <FindingsPanel findings={result.geo_findings} />}
            {activeTab === "competitors" && <CompetitorsPanel competitors={result.competitors} />}
            {activeTab === "improvements" && <ImprovementsPanel items={result.quick_wins} />}

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <button
                onClick={() => { setResult(null); setUrl(""); }}
                className="text-sm text-neutral-500 hover:text-white transition"
              >
                ← Analyse another site
              </button>
            </div>
          </div>
        )}

        {!result && !loading && (
          <div className="mt-12 flex flex-wrap justify-center gap-2">
            {["Schema & structured data", "Entity clarity", "E-E-A-T signals", "Topical authority", "Competitor gaps", "Quick wins"].map((f) => (
              <span key={f} className="px-3 py-1.5 text-xs text-neutral-400 bg-white/5 border border-white/10 rounded-full">{f}</span>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
