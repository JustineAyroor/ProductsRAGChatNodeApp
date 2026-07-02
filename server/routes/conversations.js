const express = require("express");
const storage = require("../services/storage");
const { conversationRateLimit } = require("../middleware/rateLimit");

const router = express.Router();

router.get("/", (req, res) => {
  res.json(storage.listConversations());
});

router.post("/", conversationRateLimit, (req, res) => {
  const conversation = storage.createConversation();
  res.status(201).json({ id: conversation.id });
});

router.get("/:id", (req, res) => {
  const conversation = storage.getConversation(req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }
  res.json(conversation);
});

module.exports = router;
