"use client";

import { useState, useEffect, useRef } from "react";
import { AnalysisResult, TabId } from "./types";
import ScoreCards from "./components/ScoreCards";
import TabNav from "./components/TabNav";
import FindingsPanel from "./components/FindingsPanel";
import CompetitorsPanel from "./components/CompetitorsPanel";
import ImprovementsPanel from "./components/ImprovementsPanel";

const STEPS = [
  { pct: 8,  label: "Fetching site content..." },
  { pct: 22, label: "Reading page structure and metadata..." },
  { pct: 38, label: "Searching for competitors in the industry..." },
  { pct: 54, label: "Evaluating AEO signals..." },
  { pct: 68, label: "Evaluating GEO signals..." },
  { pct: 80, label: "Benchmarking against competitors..." },
  { pct: 90, label: "Generating recommendations..." },
  { pct: 96, label: "Finalising report..." },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("aeo");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(0);

  function startProgress() {
    stepRef.current = 0;
    setProgress(STEPS[0].pct);
    setStatusMsg(STEPS[0].label);

    intervalRef.current = setInterval(() => {
      stepRef.current += 1;
      if (stepRef.current < STEPS.length) {
        setProgress(STEPS[stepRef.current].pct);
        setStatusMsg(STEPS[stepRef.current].label);
      }
    }, 3500);
  }

  function stopProgress(success: boolean) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (success) {
      setProgress(100);
      setStatusMsg("Analysis complete!");
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function runAnalysis() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    setResult(null);
    startProgress();

    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      stopProgress(true);
      // Brief pause so user sees 100% before results appear
      await new Promise(r => setTimeout(r, 400));
      setResult(data);
      setActiveTab("aeo");
    } catch (e: unknown) {
      stopProgress(false);
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
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

        <div className="flex gap-3 mb-6">
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

        {/* Progress bar */}
        {loading && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-400">{statusMsg}</span>
              <span className="text-sm font-medium text-emerald-400 tabular-nums">{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
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

            {/* Token usage footer */}
            {result.usage && (
              <div className="mt-6 pt-4 border-t border-white/8 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-neutral-600">
                  <span>
                    <span className="text-neutral-500">Input</span>{" "}
                    <span className="text-neutral-400 tabular-nums font-medium">{result.usage.input_tokens.toLocaleString()}</span>{" "}
                    <span className="text-neutral-600">tokens</span>
                  </span>
                  <span className="text-neutral-700">·</span>
                  <span>
                    <span className="text-neutral-500">Output</span>{" "}
                    <span className="text-neutral-400 tabular-nums font-medium">{result.usage.output_tokens.toLocaleString()}</span>{" "}
                    <span className="text-neutral-600">tokens</span>
                  </span>
                  <span className="text-neutral-700">·</span>
                  <span>
                    <span className="text-neutral-500">Total</span>{" "}
                    <span className="text-emerald-600 tabular-nums font-medium">{result.usage.total_tokens.toLocaleString()}</span>{" "}
                    <span className="text-neutral-600">tokens</span>
                  </span>
                </div>
                <button
                  onClick={() => { setResult(null); setUrl(""); }}
                  className="text-xs text-neutral-600 hover:text-white transition"
                >
                  ← Analyse another site
                </button>
              </div>
            )}
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
