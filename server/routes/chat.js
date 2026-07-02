const express = require("express");
const storage = require("../services/storage");
const { streamChat } = require("../services/openai");
const { logInteraction } = require("../services/logger");
const { getModelById } = require("../config/models");
const { chatRateLimit } = require("../middleware/rateLimit");

const router = express.Router();

router.post("/:id/chat", chatRateLimit, async (req, res) => {
  const { id } = req.params;
  const { message, model } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  if (!model || !getModelById(model)) {
    return res.status(400).json({ error: "Invalid model" });
  }

  const conversation = storage.getConversation(id);
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const result = await streamChat({
      history: conversation.messages,
      userMessage: message.trim(),
      model,
      onChunk: (chunk) => sendEvent({ type: "chunk", content: chunk }),
    });

    storage.appendMessages(id, message.trim(), result.content);

    const logEntry = logInteraction({
      conversationId: id,
      model,
      userMessage: message.trim(),
      assistantMessage: result.content,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    });

    sendEvent({
      type: "done",
      usage: {
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        estimatedCostUsd: logEntry.estimatedCostUsd,
      },
    });
  } catch (err) {
    sendEvent({ type: "error", error: err.message || "Failed to generate response" });
  }

  res.end();
});

module.exports = router;
