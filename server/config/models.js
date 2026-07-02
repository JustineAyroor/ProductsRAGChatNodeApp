function getProvider() {
  return (process.env.LLM_PROVIDER || "").trim().toLowerCase();
}

function isOpenRouter() {
  const key = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";
  const baseUrl = process.env.OPENAI_BASE_URL || "";
  return (
    getProvider() === "openrouter" ||
    key.startsWith("sk-or-") ||
    baseUrl.includes("openrouter")
  );
}

const OPENAI_MODELS = [
  { id: "gpt-4o-mini", label: "GPT-4o Mini", inputPer1M: 0.15, outputPer1M: 0.6 },
  { id: "gpt-4o", label: "GPT-4o", inputPer1M: 2.5, outputPer1M: 10.0 },
];

const OPENROUTER_MODELS = [
  {
    id: "openai/gpt-4o-mini",
    label: "OpenAI GPT-4o Mini",
    inputPer1M: 0.15,
    outputPer1M: 0.6,
  },
  {
    id: "openai/gpt-4o",
    label: "OpenAI GPT-4o",
    inputPer1M: 2.5,
    outputPer1M: 10.0,
  },
  {
    id: "openai/gpt-4.1-mini",
    label: "OpenAI GPT-4.1 Mini",
    inputPer1M: 0.4,
    outputPer1M: 1.6,
  },
  {
    id: "openai/gpt-4.1",
    label: "OpenAI GPT-4.1",
    inputPer1M: 2.0,
    outputPer1M: 8.0,
  },
  {
    id: "anthropic/claude-3.5-haiku",
    label: "Anthropic Claude 3.5 Haiku",
    inputPer1M: 0.8,
    outputPer1M: 4.0,
  },
  {
    id: "anthropic/claude-3.7-sonnet",
    label: "Anthropic Claude 3.7 Sonnet",
    inputPer1M: 3.0,
    outputPer1M: 15.0,
  },
  {
    id: "anthropic/claude-sonnet-4",
    label: "Anthropic Claude Sonnet 4",
    inputPer1M: 3.0,
    outputPer1M: 15.0,
  },
  {
    id: "google/gemini-2.0-flash-001",
    label: "Google Gemini 2.0 Flash",
    inputPer1M: 0.1,
    outputPer1M: 0.4,
  },
  {
    id: "google/gemini-2.5-flash",
    label: "Google Gemini 2.5 Flash",
    inputPer1M: 0.3,
    outputPer1M: 2.5,
  },
  {
    id: "google/gemini-2.5-pro",
    label: "Google Gemini 2.5 Pro",
    inputPer1M: 1.25,
    outputPer1M: 10.0,
  },
  {
    id: "meta-llama/llama-3.1-8b-instruct:free",
    label: "Meta Llama 3.1 8B Instruct Free",
    inputPer1M: 0,
    outputPer1M: 0,
  },
  {
    id: "meta-llama/llama-3.1-70b-instruct",
    label: "Meta Llama 3.1 70B Instruct",
    inputPer1M: 0.35,
    outputPer1M: 0.4,
  },
  {
    id: "mistralai/mistral-small-3.1-24b-instruct",
    label: "Mistral Small 3.1 24B",
    inputPer1M: 0.1,
    outputPer1M: 0.3,
  },
  {
    id: "deepseek/deepseek-chat-v3-0324",
    label: "DeepSeek Chat V3",
    inputPer1M: 0.27,
    outputPer1M: 1.1,
  },
  {
    id: "deepseek/deepseek-r1",
    label: "DeepSeek R1",
    inputPer1M: 0.55,
    outputPer1M: 2.19,
  },
];

const MODELS = isOpenRouter() ? OPENROUTER_MODELS : OPENAI_MODELS;

function getModelById(id) {
  return MODELS.find((m) => m.id === id);
}

function estimateCost(modelId, inputTokens, outputTokens) {
  const model = getModelById(modelId);
  if (!model) return 0;
  return (
    (inputTokens / 1_000_000) * model.inputPer1M +
    (outputTokens / 1_000_000) * model.outputPer1M
  );
}

module.exports = { MODELS, getModelById, estimateCost, getProvider, isOpenRouter };
