import OpenAI from "openai";

const MODEL = "gpt-4o-mini";

const ANALYSIS_SYSTEM_PROMPT = `You are a customer experience analysis expert. Analyze the provided customer review.

You MUST respond with a single JSON object only (no markdown, no code fences) with exactly these fields:
- sentimentScore: integer from 1 (very negative) to 100 (very positive)
- isCritical: boolean — true if the issue is severe or could significantly harm the brand
- category: short string label (e.g. "billing", "crash", "feature_request", "general_feedback")
- summary: one clear sentence summarizing the issue or feedback
- responseDrafts: array of exactly 3 objects, each with:
  - "variant": one of the strings "empathetic", "official", "action_oriented" (exactly these spellings)
  - "text": the full draft reply string for that variant

The three variants must be:
1. empathetic — apologies and understanding
2. official — professional and concise
3. action_oriented — concrete troubleshooting or next steps`;

function requireApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key?.trim()) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return key;
}

export type ReviewDrafts = {
  empathetic: string;
  official: string;
  action_oriented: string;
};

export type ReviewAnalysisResult = {
  sentimentScore: number;
  isCritical: boolean;
  category: string;
  summary: string;
  drafts: ReviewDrafts;
};

type RawDraft = {
  variant?: unknown;
  text?: unknown;
};

type RawAnalysisJson = {
  sentimentScore?: unknown;
  isCritical?: unknown;
  category?: unknown;
  summary?: unknown;
  responseDrafts?: unknown;
};

function clampSentimentScore(value: number): number {
  if (Number.isNaN(value)) return 50;
  return Math.min(100, Math.max(1, Math.round(value)));
}

function parseDrafts(raw: unknown): ReviewDrafts {
  if (!Array.isArray(raw)) {
    throw new Error("responseDrafts must be an array");
  }
  const byVariant: Partial<Record<keyof ReviewDrafts, string>> = {};
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const d = item as RawDraft;
    if (typeof d.variant !== "string" || typeof d.text !== "string") continue;
    const v = d.variant.trim().toLowerCase().replace(/-/g, "_");
    if (v === "empathetic") byVariant.empathetic = d.text;
    else if (v === "official") byVariant.official = d.text;
    else if (v === "action_oriented") byVariant.action_oriented = d.text;
  }
  if (
    typeof byVariant.empathetic !== "string" ||
    typeof byVariant.official !== "string" ||
    typeof byVariant.action_oriented !== "string"
  ) {
    throw new Error(
      "responseDrafts must include empathetic, official, and action_oriented variants with text",
    );
  }
  return {
    empathetic: byVariant.empathetic,
    official: byVariant.official,
    action_oriented: byVariant.action_oriented,
  };
}

function parseAnalysisJson(raw: unknown): ReviewAnalysisResult {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("AI returned invalid JSON root");
  }
  const o = raw as RawAnalysisJson;
  if (typeof o.sentimentScore !== "number") {
    throw new Error("sentimentScore must be a number");
  }
  if (typeof o.isCritical !== "boolean") {
    throw new Error("isCritical must be a boolean");
  }
  if (typeof o.category !== "string" || !o.category.trim()) {
    throw new Error("category must be a non-empty string");
  }
  if (typeof o.summary !== "string" || !o.summary.trim()) {
    throw new Error("summary must be a non-empty string");
  }
  return {
    sentimentScore: clampSentimentScore(o.sentimentScore),
    isCritical: o.isCritical,
    category: o.category.trim(),
    summary: o.summary.trim(),
    drafts: parseDrafts(o.responseDrafts),
  };
}

export async function analyzeReview(text: string): Promise<ReviewAnalysisResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Review text is empty");
  }

  const client = new OpenAI({ apiKey: requireApiKey() });

  const completion = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
      { role: "user", content: `Review text:\n\n${trimmed}` },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty message");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content) as unknown;
  } catch {
    throw new Error("OpenAI returned non-JSON content");
  }

  return parseAnalysisJson(parsed);
}
