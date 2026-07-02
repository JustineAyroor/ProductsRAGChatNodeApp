const fs = require("fs");
const path = require("path");
const { validate: validateUuid, v4: uuidv4 } = require("uuid");

const DATA_DIR = path.join(__dirname, "../../data/conversations");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getConversationPath(id) {
  if (!validateUuid(id)) {
    return null;
  }
  return path.join(DATA_DIR, `${id}.json`);
}

function createConversation() {
  ensureDir();
  const id = uuidv4();
  const conversation = {
    id,
    title: "New conversation",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };
  fs.writeFileSync(getConversationPath(id), JSON.stringify(conversation, null, 2));
  return conversation;
}

function listConversations() {
  ensureDir();
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  const conversations = files
    .map((file) => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));
        return {
          id: data.id,
          title: data.title,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          messageCount: Array.isArray(data.messages) ? data.messages.length : 0,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return conversations;
}

function getConversation(id) {
  const filePath = getConversationPath(id);
  if (!filePath || !fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function saveConversation(conversation) {
  ensureDir();
  conversation.updatedAt = new Date().toISOString();
  fs.writeFileSync(
    getConversationPath(conversation.id),
    JSON.stringify(conversation, null, 2)
  );
  return conversation;
}

function appendMessages(id, userMessage, assistantMessage) {
  const conversation = getConversation(id);
  if (!conversation) return null;

  const now = new Date().toISOString();
  conversation.messages.push({
    role: "user",
    content: userMessage,
    timestamp: now,
  });
  conversation.messages.push({
    role: "assistant",
    content: assistantMessage,
    timestamp: now,
  });

  if (conversation.title === "New conversation" && userMessage) {
    conversation.title =
      userMessage.length > 50 ? userMessage.slice(0, 50) + "..." : userMessage;
  }

  return saveConversation(conversation);
}

module.exports = {
  createConversation,
  listConversations,
  getConversation,
  saveConversation,
  appendMessages,
};
