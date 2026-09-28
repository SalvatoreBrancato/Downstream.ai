// Standard text API prices in USD per million tokens, checked 2026-09-28.
// Cache, batch, regional processing and tool fees are excluded.
// DeepSeek uses its peak, cache-miss rates; off-peak rates are lower.
// Official sources:
// https://developers.openai.com/api/docs/pricing
// https://developers.openai.com/api/docs/models/gpt-5-nano
// https://platform.claude.com/docs/en/models/overview
// https://ai.google.dev/gemini-api/docs/pricing
// https://api-docs.deepseek.com/quick_start/pricing
// https://docs.x.ai/developers/pricing
export const MODEL_GROUPS = [
  { provider: "OpenAI", models: [
    { id: "gpt-6-astra", label: "GPT-6 Astra", input: 10, output: 50, longContext: { threshold: 272000, input: 20, output: 75 } },
    { id: "gpt-6-sol", label: "GPT-6 Sol", input: 2, output: 10, longContext: { threshold: 272000, input: 4, output: 15 } },
    { id: "gpt-6-luna", label: "GPT-6 Luna", input: 0.1, output: 0.5, longContext: { threshold: 272000, input: 0.2, output: 0.75 } },
    { id: "gpt-5-nano", label: "GPT-5 Nano", input: 0.05, output: 0.4 },
  ] },
  { provider: "Anthropic", models: [
    { id: "claude-opus-5-5", label: "Claude Opus 5.5", input: 4, output: 20 },
    { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", input: 2, output: 10 },
    { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", input: 1, output: 5 },
  ] },
  { provider: "Google", models: [
    { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", input: 2, output: 12, longContext: { threshold: 200000, input: 4, output: 18 } },
    { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash (promo 2026)", input: 0.75, output: 3.75 },
    { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite", input: 0.3, output: 2.5 },
  ] },
  { provider: "DeepSeek", models: [
    { id: "deepseek-flash", label: "DeepSeek V4.1 Flash (picco)", input: 0.3, output: 1.2 },
    { id: "deepseek-v4-pro", label: "DeepSeek V4 Pro (picco)", input: 1.32, output: 3.96 },
  ] },
  { provider: "xAI", models: [
    { id: "grok-4.7", label: "Grok 4.7", input: 2, output: 6, longContext: { threshold: 200000, inclusive: true, input: 4, output: 12 } },
    { id: "grok-4.3", label: "Grok 4.3", input: 1.25, output: 2.5, longContext: { threshold: 200000, inclusive: true, input: 2.5, output: 5 } },
    { id: "grok-build-0.1", label: "Grok Build", input: 1, output: 2, longContext: { threshold: 200000, inclusive: true, input: 2, output: 4 } },
  ] },
];

export const MODEL_PRICES = Object.fromEntries(
  MODEL_GROUPS.flatMap(({ models }) => models.map((model) => [model.id, model]))
);

export function getRates(model, inputTokens = 0) {
  if (!model || !Number.isFinite(model.input) || !Number.isFinite(model.output)) return null;
  const long = model.longContext;
  if (long && (long.inclusive ? inputTokens >= long.threshold : inputTokens > long.threshold)) {
    return long;
  }
  return model;
}

export function estimateCost(tokens, ratePerMillion) {
  return tokens * ratePerMillion / 1_000_000;
}

export function formatUsd(amount) {
  if (amount === 0) return "$0.00";
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: amount < 0.01 ? 6 : 4,
    maximumFractionDigits: amount < 0.01 ? 6 : 4,
  })}`;
}

export function payloadText(value) {
  return typeof value === "object"
    ? JSON.stringify(value, null, 2)
    : String(value || "{}");
}
