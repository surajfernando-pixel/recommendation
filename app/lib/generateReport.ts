import { jsPDF } from "jspdf";
import { AnalysisResult, Severity } from "../types";

const BRAND = {
  emerald: [16, 185, 129] as [number, number, number],
  emeraldLight: [209, 250, 229] as [number, number, number],
  dark: [10, 10, 10] as [number, number, number],
  surface: [24, 24, 27] as [number, number, number],
  surfaceLight: [39, 39, 42] as [number, number, number],
  border: [63, 63, 70] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  muted: [161, 161, 170] as [number, number, number],
  subtle: [113, 113, 122] as [number, number, number],
};

const SEVERITY_COLORS: Record<Severity, { bg: [number, number, number]; text: [number, number, number]; label: string }> = {
  critical: { bg: [239, 68, 68], text: [254, 226, 226], label: "CRITICAL" },
  warning:  { bg: [245, 158, 11], text: [254, 243, 199], label: "WARNING" },
  good:     { bg: [16, 185, 129], text: [209, 250, 229], label: "GOOD" },
  info:     { bg: [59, 130, 246], text: [219, 234, 254], label: "INFO" },
};

function scoreColor(n: number): [number, number, number] {
  if (n >= 70) return BRAND.emerald;
  if (n >= 45) return [245, 158, 11];
  return [239, 68, 68];
}

function scoreLabel(n: number): string {
  if (n >= 70) return "Strong";
  if (n >= 45) return "Needs work";
  return "Poor";
}

function wrapText(doc: jsPDF, text: string, x: number, maxWidth: number, lineHeight: number): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, 0);
  return lines.length * lineHeight;
}

export function generatePDF(result: AnalysisResult, siteUrl: string): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const MARGIN = 18;
  const CONTENT_W = W - MARGIN * 2;
  let y = 0;

  // ── helpers ──────────────────────────────────────────────────────────────
  function newPage() {
    doc.addPage();
    y = MARGIN;
    // Subtle page header
    doc.setFillColor(...BRAND.surface);
    doc.rect(0, 0, W, 10, "F");
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.subtle);
    doc.text("AEO + GEO Analysis Report", MARGIN, 7);
    doc.text(siteUrl, W - MARGIN, 7, { align: "right" });
    y = 18;
  }

  function checkPageBreak(needed: number) {
    if (y + needed > 275) newPage();
  }

  function sectionHeading(title: string) {
    checkPageBreak(14);
    y += 4;
    doc.setFillColor(...BRAND.emerald);
    doc.rect(MARGIN, y, 3, 6, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.white);
    doc.text(title, MARGIN + 6, y + 5);
    y += 12;
  }

  function divider() {
    doc.setDrawColor(...BRAND.border);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y, W - MARGIN, y);
    y += 5;
  }

  // ── COVER PAGE ────────────────────────────────────────────────────────────
  doc.setFillColor(...BRAND.dark);
  doc.rect(0, 0, W, 297, "F");

  // Top accent stripe
  doc.setFillColor(...BRAND.emerald);
  doc.rect(0, 0, W, 2, "F");

  // Logo mark
  doc.setFillColor(...BRAND.emerald);
  doc.roundedRect(MARGIN, 28, 14, 14, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.dark);
  doc.text("AG", MARGIN + 7, 37, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.muted);
  doc.text("AEO + GEO Analyser", MARGIN + 18, 37);

  // Title block
  y = 75;
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.white);
  const titleLines = doc.splitTextToSize("Site Analysis Report", CONTENT_W);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * 11 + 4;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.emerald);
  const urlLines = doc.splitTextToSize(siteUrl, CONTENT_W);
  doc.text(urlLines, MARGIN, y);
  y += urlLines.length * 6 + 16;

  // Site summary box
  doc.setFillColor(...BRAND.surface);
  const summaryLines = doc.splitTextToSize(result.site_summary, CONTENT_W - 16);
  const summaryH = summaryLines.length * 6 + 14;
  doc.roundedRect(MARGIN, y, CONTENT_W, summaryH, 3, 3, "F");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text(summaryLines, MARGIN + 8, y + 9);
  y += summaryH + 20;

  // Score cards (3 across)
  const cardW = (CONTENT_W - 8) / 3;
  const scores = [
    { label: "Overall Score", value: result.scores.overall, sub: "AEO + GEO combined" },
    { label: "AEO Score", value: result.scores.aeo, sub: "Answer engine readiness" },
    { label: "GEO Score", value: result.scores.geo, sub: "Generative engine readiness" },
  ];

  scores.forEach((s, i) => {
    const cx = MARGIN + i * (cardW + 4);
    doc.setFillColor(...BRAND.surface);
    doc.roundedRect(cx, y, cardW, 38, 3, 3, "F");

    // Coloured top border
    doc.setFillColor(...scoreColor(s.value));
    doc.roundedRect(cx, y, cardW, 2, 1, 1, "F");

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.muted);
    doc.text(s.label.toUpperCase(), cx + cardW / 2, y + 9, { align: "center" });

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...scoreColor(s.value));
    doc.text(`${s.value}`, cx + cardW / 2, y + 23, { align: "center" });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.subtle);
    doc.text(`${scoreLabel(s.value)} — ${s.sub}`, cx + cardW / 2, y + 31, { align: "center" });
  });

  y += 52;

  // Generated date + token usage
  const dateStr = new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.subtle);
  doc.text(`Generated ${dateStr}`, MARGIN, y);
  if (result.usage) {
    doc.text(`${result.usage.total_tokens.toLocaleString()} tokens used`, W - MARGIN, y, { align: "right" });
  }

  // Bottom accent
  doc.setFillColor(...BRAND.emerald);
  doc.rect(0, 295, W, 2, "F");

  // ── PAGE 2: AEO + GEO FINDINGS ────────────────────────────────────────────
  newPage();

  // AEO Findings
  sectionHeading("AEO Findings");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.muted);
  doc.text("How well this site is structured for answer engines like Perplexity, Google AI Overviews, and ChatGPT.", MARGIN, y);
  y += 8;

  result.aeo_findings.forEach((f) => {
    const sev = SEVERITY_COLORS[f.severity];
    const bodyLines = doc.splitTextToSize(f.detail, CONTENT_W - 14);
    const cardH = 8 + 6 + bodyLines.length * 5 + 8;
    checkPageBreak(cardH + 4);

    doc.setFillColor(...BRAND.surface);
    doc.roundedRect(MARGIN, y, CONTENT_W, cardH, 2, 2, "F");

    // Severity badge
    doc.setFillColor(...sev.bg);
    doc.roundedRect(MARGIN + 6, y + 6, 18, 5, 1, 1, "F");
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...sev.text);
    doc.text(sev.label, MARGIN + 15, y + 10, { align: "center" });

    // Title
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.white);
    doc.text(f.title, MARGIN + 28, y + 10);

    // Body
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.muted);
    doc.text(bodyLines, MARGIN + 6, y + 18);

    y += cardH + 3;
  });

  y += 4;

  // GEO Findings
  sectionHeading("GEO Findings");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.muted);
  doc.text("How likely this site's content is to be cited or surfaced by generative AI tools.", MARGIN, y);
  y += 8;

  result.geo_findings.forEach((f) => {
    const sev = SEVERITY_COLORS[f.severity];
    const bodyLines = doc.splitTextToSize(f.detail, CONTENT_W - 14);
    const cardH = 8 + 6 + bodyLines.length * 5 + 8;
    checkPageBreak(cardH + 4);

    doc.setFillColor(...BRAND.surface);
    doc.roundedRect(MARGIN, y, CONTENT_W, cardH, 2, 2, "F");

    doc.setFillColor(...sev.bg);
    doc.roundedRect(MARGIN + 6, y + 6, 18, 5, 1, 1, "F");
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...sev.text);
    doc.text(sev.label, MARGIN + 15, y + 10, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.white);
    doc.text(f.title, MARGIN + 28, y + 10);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.muted);
    doc.text(bodyLines, MARGIN + 6, y + 18);

    y += cardH + 3;
  });

  // ── PAGE 3: COMPETITORS + QUICK WINS ─────────────────────────────────────
  sectionHeading("Competitor Analysis");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.muted);
  doc.text("What top competitors do better, and what this site should adopt.", MARGIN, y);
  y += 8;

  result.competitors.forEach((c, idx) => {
    const advLines = doc.splitTextToSize(c.advantage, CONTENT_W - 14);
    const gapLines = doc.splitTextToSize(`Adopt: ${c.gap}`, CONTENT_W - 14);
    const cardH = 10 + advLines.length * 5 + 4 + gapLines.length * 5 + 8;
    checkPageBreak(cardH + 4);

    doc.setFillColor(...BRAND.surface);
    doc.roundedRect(MARGIN, y, CONTENT_W, cardH, 2, 2, "F");

    // Index dot
    doc.setFillColor(...BRAND.emerald);
    doc.circle(MARGIN + 9, y + 9, 4, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.dark);
    doc.text(`${idx + 1}`, MARGIN + 9, y + 11, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.white);
    doc.text(c.name, MARGIN + 17, y + 10);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.muted);
    doc.text(advLines, MARGIN + 6, y + 17);

    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND.emerald);
    doc.text(gapLines, MARGIN + 6, y + 17 + advLines.length * 5 + 4);

    y += cardH + 3;
  });

  y += 4;

  sectionHeading("Quick Wins");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.muted);
  doc.text("Prioritised improvements to make immediately.", MARGIN, y);
  y += 8;

  result.quick_wins.forEach((qw, idx) => {
    const actionLines = doc.splitTextToSize(qw.action, CONTENT_W - 22);
    const cardH = actionLines.length * 5 + 14;
    checkPageBreak(cardH + 4);

    // Left accent bar
    doc.setFillColor(...BRAND.emerald);
    doc.rect(MARGIN, y, 3, cardH, "F");

    doc.setFillColor(...BRAND.surface);
    doc.rect(MARGIN + 3, y, CONTENT_W - 3, cardH, "F");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.emerald);
    doc.text(`${String(idx + 1).padStart(2, "0")}  ${qw.category.toUpperCase()}`, MARGIN + 8, y + 7);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.white);
    doc.text(actionLines, MARGIN + 8, y + 13);

    y += cardH + 3;
  });

  // ── FINAL PAGE FOOTER ─────────────────────────────────────────────────────
  divider();
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND.subtle);
  if (result.usage) {
    doc.text(
      `Analysis used ${result.usage.input_tokens.toLocaleString()} input tokens + ${result.usage.output_tokens.toLocaleString()} output tokens = ${result.usage.total_tokens.toLocaleString()} total  ·  Powered by Claude + web search`,
      MARGIN,
      y
    );
  }

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    if (i > 1) {
      doc.setFontSize(7);
      doc.setTextColor(...BRAND.subtle);
      doc.text(`${i} / ${pageCount}`, W - MARGIN, 290, { align: "right" });
    }
  }

  // Download
  const filename = `aeo-geo-report-${new URL(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`).hostname}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

// Suppress unused warning for wrapText
void wrapText;
