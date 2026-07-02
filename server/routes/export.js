const express = require("express");
const storage = require("../services/storage");
const { getLogsForConversation } = require("../services/logger");

const router = express.Router();

function escapeCsv(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

router.get("/:id/export", (req, res) => {
  const conversation = storage.getConversation(req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  const format = req.query.format || "json";

  if (format === "json") {
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="conversation-${conversation.id}.json"`
    );
    return res.json(conversation);
  }

  if (format === "csv") {
    const logs = getLogsForConversation(conversation.id);
    const headers = ["conversationId", "timestamp", "role", "content", "model"];
    const rows = [headers.join(",")];

    for (const msg of conversation.messages) {
      let model = "";
      if (msg.role === "assistant") {
        const matchingLog = logs.find(
          (l) => l.assistantMessage === msg.content
        );
        model = matchingLog?.model || "";
      }
      rows.push(
        [
          escapeCsv(conversation.id),
          escapeCsv(msg.timestamp),
          escapeCsv(msg.role),
          escapeCsv(msg.content),
          escapeCsv(model),
        ].join(",")
      );
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="conversation-${conversation.id}.csv"`
    );
    return res.send(rows.join("\n"));
  }

  res.status(400).json({ error: "Invalid format. Use json or csv." });
});

module.exports = router;
