require("dotenv").config();

const OpenAI = require("openai");
const { MODELS, isOpenRouter } = require("../server/config/models");

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const key = process.env.OPENROUTER_API_KEY || "";
const model = process.env.TEST_OPENROUTER_MODEL || MODELS[0]?.id || "openai/gpt-4o-mini";
const baseURL = process.env.OPENAI_BASE_URL || OPENROUTER_BASE_URL;

function redactKey(value) {
  if (!value) return "missing";
  return `${value.slice(0, 8)}... (${value.length} chars)`;
}

async function main() {
  console.log("OpenRouter configuration check");
  console.log({
    provider: process.env.LLM_PROVIDER || "auto",
    isOpenRouter: isOpenRouter(),
    baseURL,
    key: redactKey(key),
    model,
    modelCount: MODELS.length,
  });

  if (!key) {
    throw new Error("OPENROUTER_API_KEY is missing in .env");
  }

  if (!isOpenRouter()) {
    throw new Error(
      "OpenRouter is not enabled. Set LLM_PROVIDER=openrouter and OPENAI_BASE_URL=https://openrouter.ai/api/v1"
    );
  }

  if (!key.startsWith("sk-or-")) {
    console.warn(
      "Warning: this key does not look like an OpenRouter key. OpenRouter keys usually start with sk-or-."
    );
  }

  const client = new OpenAI({
    apiKey: key,
    baseURL,
    defaultHeaders: {
      "HTTP-Referer": process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`,
      "X-Title": process.env.APP_NAME || "Employee Chatbot",
    },
  });

  const response = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: "Reply with exactly: openrouter ok" }],
    max_tokens: 10,
  });

  console.log("OpenRouter response");
  console.log({
    ok: true,
    model: response.model,
    content: response.choices[0]?.message?.content,
    usage: response.usage || null,
  });
}

main().catch((err) => {
  console.error("OpenRouter test failed");
  console.error({
    status: err.status,
    message: err.message,
  });
  process.exit(1);
});
