const OpenAI = require("openai");
const { retrieveContext } = require("./knowledge");
const { isOpenRouter } = require("../config/models");

const SYSTEM_PROMPT_BASE =
  "You are an internal employee assistant. Answer ONLY using the provided context. " +
  "If the answer is not in the context, say you don't have that information. " +
  "Cite the product name or section when relevant.";

const DEFAULT_MAX_PROMPT_TOKENS = 8000;
const DEFAULT_MAX_OUTPUT_TOKENS = 700;
const DEFAULT_MAX_CONTEXT_CHARS = 8000;
const DEFAULT_MAX_HISTORY_MESSAGES = 12;

function envInt(name, fallback) {
  const value = parseInt(process.env[name] || "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function estimateTokens(text = "") {
  // A small, dependency-free approximation. English text is usually around
  // 3-4 chars/token; using 4 keeps enough safety margin for prompt budgeting.
  return Math.ceil(String(text).length / 4);
}

function estimateMessageTokens(message) {
  return estimateTokens(message.content) + 6;
}

function trimText(text, maxChars) {
  if (!text || text.length <= maxChars) return text || "";
  return `${text.slice(0, maxChars)}\n\n[Context trimmed to stay within the token budget.]`;
}

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const options = { apiKey: process.env.OPENAI_API_KEY };

  if (process.env.OPENAI_BASE_URL) {
    options.baseURL = process.env.OPENAI_BASE_URL;
  } else if (isOpenRouter()) {
    options.baseURL = "https://openrouter.ai/api/v1";
  }

  return new OpenAI(options);
}

function buildMessages(history, userMessage) {
  const maxPromptTokens = envInt("MAX_PROMPT_TOKENS", DEFAULT_MAX_PROMPT_TOKENS);
  const maxContextChars = envInt("MAX_CONTEXT_CHARS", DEFAULT_MAX_CONTEXT_CHARS);
  const maxHistoryMessages = envInt(
    "MAX_HISTORY_MESSAGES",
    DEFAULT_MAX_HISTORY_MESSAGES
  );

  const context = trimText(retrieveContext(userMessage), maxContextChars);
  const systemPrompt = `${SYSTEM_PROMPT_BASE}\n\n--- CONTEXT ---\n${context}`;

  const messages = [{ role: "system", content: systemPrompt }];
  const selectedHistory = [];
  let tokenBudget =
    maxPromptTokens -
    estimateMessageTokens(messages[0]) -
    estimateMessageTokens({ role: "user", content: userMessage });

  const recentHistory = (history || [])
    .filter((msg) => msg && ["user", "assistant"].includes(msg.role) && msg.content)
    .slice(-maxHistoryMessages);

  for (let i = recentHistory.length - 1; i >= 0; i -= 1) {
    const msg = recentHistory[i];
    const estimated = estimateMessageTokens(msg);
    if (estimated > tokenBudget) break;
    selectedHistory.unshift({ role: msg.role, content: msg.content });
    tokenBudget -= estimated;
  }

  messages.push(...selectedHistory);

  messages.push({ role: "user", content: userMessage });
  return messages;
}

function friendlyOpenAIError(err) {
  const rawMessage = err?.message || "Failed to generate response";
  const message = rawMessage.toLowerCase();

  if (
    message.includes("context_length") ||
    message.includes("maximum context") ||
    message.includes("too many tokens")
  ) {
    return (
      "This conversation is too large for the selected model. I trimmed recent " +
      "history automatically, but this request is still too long. Try a shorter " +
      "message or start a new conversation."
    );
  }

  if (
    message.includes("insufficient_quota") ||
    message.includes("quota") ||
    message.includes("credit") ||
    message.includes("billing") ||
    message.includes("exhaust")
  ) {
    return (
      "The LLM provider says the API key has no remaining quota/credits. Add " +
      "billing or credits for that key, or switch to a key/model with available quota."
    );
  }

  if (err?.status === 401 || message.includes("invalid api key")) {
    return "The LLM API key is missing or invalid. Check OPENAI_API_KEY in .env.";
  }

  if (err?.status === 429 || message.includes("rate limit")) {
    return "The LLM provider rate-limited this request. Please wait a moment and try again.";
  }

  return rawMessage;
}

async function streamChat({ history, userMessage, model, onChunk }) {
  const client = getClient();
  const messages = buildMessages(history, userMessage);
  const maxOutputTokens = envInt("MAX_OUTPUT_TOKENS", DEFAULT_MAX_OUTPUT_TOKENS);

  let stream;
  try {
    stream = await client.chat.completions.create({
      model,
      messages,
      stream: true,
      stream_options: { include_usage: true },
      max_tokens: maxOutputTokens,
    });
  } catch (err) {
    throw new Error(friendlyOpenAIError(err));
  }

  let fullContent = "";
  let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  try {
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullContent += delta;
        onChunk(delta);
      }
      if (chunk.usage) {
        usage = chunk.usage;
      }
    }
  } catch (err) {
    throw new Error(friendlyOpenAIError(err));
  }

  return {
    content: fullContent,
    inputTokens: usage.prompt_tokens || 0,
    outputTokens: usage.completion_tokens || 0,
  };
}

module.exports = { streamChat, buildMessages };
