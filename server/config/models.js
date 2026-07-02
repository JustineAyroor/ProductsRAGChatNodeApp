function isOpenRouter() {
  const key = process.env.OPENAI_API_KEY || "";
  const baseUrl = process.env.OPENAI_BASE_URL || "";
  return key.startsWith("sk-or-") || baseUrl.includes("openrouter");
}

const OPENAI_MODELS = [
  { id: "gpt-4o-mini", label: "GPT-4o Mini", inputPer1M: 0.15, outputPer1M: 0.6 },
  { id: "gpt-4o", label: "GPT-4o", inputPer1M: 2.5, outputPer1M: 10.0 },
];

const OPENROUTER_MODELS = [
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini", inputPer1M: 0.15, outputPer1M: 0.6 },
  { id: "openai/gpt-4o", label: "GPT-4o", inputPer1M: 2.5, outputPer1M: 10.0 },
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

module.exports = { MODELS, getModelById, estimateCost, isOpenRouter };
