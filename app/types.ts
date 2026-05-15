export type Severity = "critical" | "warning" | "good" | "info";

export interface Finding {
  title: string;
  detail: string;
  severity: Severity;
}

export interface Competitor {
  name: string;
  advantage: string;
  gap: string;
}

export interface QuickWin {
  category: string;
  action: string;
}

export interface AnalysisResult {
  scores: {
    aeo: number;
    geo: number;
    overall: number;
  };
  site_summary: string;
  aeo_findings: Finding[];
  geo_findings: Finding[];
  competitors: Competitor[];
  quick_wins: QuickWin[];
}

export type TabId = "aeo" | "geo" | "competitors" | "improvements";
