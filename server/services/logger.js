const fs = require("fs");
const path = require("path");
const { estimateCost } = require("../config/models");

const LOG_DIR = path.join(__dirname, "../../data/logs");
const LOG_FILE = path.join(LOG_DIR, "interactions.json");

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function readLogs() {
  ensureLogDir();
  if (!fs.existsSync(LOG_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function logInteraction({
  conversationId,
  model,
  userMessage,
  assistantMessage,
  inputTokens,
  outputTokens,
}) {
  ensureLogDir();
  const logs = readLogs();
  const entry = {
    timestamp: new Date().toISOString(),
    conversationId,
    model,
    userMessage,
    assistantMessage,
    inputTokens,
    outputTokens,
    estimatedCostUsd: estimateCost(model, inputTokens, outputTokens),
  };
  logs.push(entry);
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  return entry;
}

function getLogs({ page = 1, limit = 50 } = {}) {
  const logs = readLogs();
  const start = (page - 1) * limit;
  const paginated = logs.slice().reverse().slice(start, start + limit);
  return {
    total: logs.length,
    page,
    limit,
    logs: paginated,
  };
}

function getLogsForConversation(conversationId) {
  return readLogs().filter((l) => l.conversationId === conversationId);
}

module.exports = { logInteraction, getLogs, getLogsForConversation };
