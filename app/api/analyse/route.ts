import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type MessageParam = Anthropic.MessageParam;
type ContentBlock = Anthropic.ContentBlock;

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it to your .env.local file or Vercel environment variables." },
      { status: 500 }
    );
  }

  const prompt = `You are an expert in AEO (Answer Engine Optimisation) and GEO (Generative Engine Optimisation).

Use web search to:
1. Fetch and examine the website at: ${url}
2. Search for top 3-5 direct competitors in the same industry
3. Analyse what those competitors do better for AEO/GEO

Then return ONLY a valid JSON object (no markdown, no preamble, no backticks) with this exact structure:

{
  "scores": {
    "aeo": <integer 0-100>,
    "geo": <integer 0-100>,
    "overall": <integer 0-100>
  },
  "site_summary": "<1-2 sentence description of what the site does and who it serves>",
  "aeo_findings": [
    {
      "title": "<short finding title>",
      "detail": "<2-3 sentence explanation of the issue or strength>",
      "severity": "critical|warning|good|info"
    }
  ],
  "geo_findings": [
    {
      "title": "<short finding title>",
      "detail": "<2-3 sentence explanation>",
      "severity": "critical|warning|good|info"
    }
  ],
  "competitors": [
    {
      "name": "<competitor domain or brand name>",
      "advantage": "<1 sentence: what they do better>",
      "gap": "<what the analysed site should copy or learn from this competitor>"
    }
  ],
  "quick_wins": [
    {
      "category": "<e.g. Structured data / Content / Entity clarity / Citations / FAQ schema>",
      "action": "<specific, actionable improvement this site should make immediately>"
    }
  ]
}

AEO scoring criteria (answer engines like Perplexity, Google AI Overviews, ChatGPT):
- Structured data / schema markup (FAQ, Article, HowTo, Organization)
- Clear entity definitions and named entities
- Concise, direct answers to likely questions
- Headers and semantic HTML structure
- Page speed and Core Web Vitals indicators
- Author/source credibility signals

GEO scoring criteria (generative AI citation likelihood):
- Content depth and topical authority
- Factual, verifiable claims with statistics
- Citation-worthy statistics, studies, or original data
- E-E-A-T signals (experience, expertise, authoritativeness, trust)
- Freshness and update frequency signals
- Unique insights vs. generic content
- Structured reference material AI models want to cite

Provide 4-6 AEO findings, 4-6 GEO findings, 3-5 competitors, and 5-7 quick wins. Be specific and actionable. Scores should be honest and calibrated.`;

  try {
    const messages: MessageParam[] = [
      { role: "user", content: prompt }
    ];

    const tools: Anthropic.Tool[] = [
      { type: "web_search_20250305", name: "web_search" } as unknown as Anthropic.Tool
    ];

    let finalText = "";
    let iterations = 0;
    const maxIterations = 10;

    // Accumulate token usage across all turns
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    while (iterations < maxIterations) {
      iterations++;

      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        tools,
        messages,
      });

      // Accumulate tokens from each API call
      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;

      const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text");
      if (textBlocks.length > 0) {
        finalText = textBlocks.map(b => b.text).join("");
      }

      if (response.stop_reason === "end_turn") {
        break;
      }

      if (response.stop_reason === "tool_use") {
        messages.push({
          role: "assistant",
          content: response.content as ContentBlock[],
        });

        const toolUseBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
        );

        const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map((block) => ({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: JSON.stringify(block.input),
        }));

        messages.push({
          role: "user",
          content: toolResults,
        });

        continue;
      }

      break;
    }

    if (!finalText) {
      return NextResponse.json(
        { error: "No text response received after tool use. Please try again." },
        { status: 500 }
      );
    }

    const cleaned = finalText.replace(/```json|```/g, "").trim();
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");

    if (jsonStart === -1 || jsonEnd === -1) {
      return NextResponse.json(
        { error: "Could not find JSON in model response. Raw: " + cleaned.substring(0, 300) },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));

    // Attach token usage to the response
    parsed.usage = {
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      total_tokens: totalInputTokens + totalOutputTokens,
    };

    return NextResponse.json(parsed);

  } catch (err: unknown) {
    console.error("Analysis error:", err);

    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `API error ${err.status}: ${err.message}` },
        { status: err.status ?? 500 }
      );
    }

    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse JSON from model response. Please try again." },
        { status: 500 }
      );
    }

    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
