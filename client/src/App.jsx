import { useCallback, useEffect, useState } from "react";
import {
  createConversation,
  fetchConversation,
  fetchConversations,
  fetchModels,
  streamChat,
} from "./api";
import ChatInput from "./components/ChatInput";
import ExportMenu from "./components/ExportMenu";
import MessageList from "./components/MessageList";
import ModelSelect from "./components/ModelSelect";
import Sidebar from "./components/Sidebar";

export default function App() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [usage, setUsage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    const list = await fetchConversations();
    setConversations(list);
  }, []);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      setError(null);
      try {
        const modelList = await fetchModels();
        setModels(modelList);
        if (modelList.length > 0) setSelectedModel(modelList[0].id);
        const list = await fetchConversations();
        setConversations(list);

        if (list.length > 0) {
          const latest = await fetchConversation(list[0].id);
          setConversationId(latest.id);
          setMessages(latest.messages);
        } else {
          const { id } = await createConversation();
          setConversationId(id);
          setConversations(await fetchConversations());
        }
      } catch (err) {
        setError(
          err.message === "Failed to fetch"
            ? "Cannot reach the API server. Make sure the backend is running on port 3000 (npm run dev:server)."
            : err.message
        );
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [loadConversations]);

  const selectConversation = async (id) => {
    try {
      const conv = await fetchConversation(id);
      setConversationId(conv.id);
      setMessages(conv.messages);
      setUsage(null);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleNewConversation = async () => {
    try {
      const { id } = await createConversation();
      setConversationId(id);
      setMessages([]);
      setUsage(null);
      setError(null);
      await loadConversations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSend = async (message) => {
    if (!conversationId || isStreaming) return;

    setError(null);
    setUsage(null);
    setIsStreaming(true);

    const userMsg = { role: "user", content: message };
    const assistantPlaceholder = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);

    try {
      await streamChat(conversationId, message, selectedModel, (event) => {
        if (event.type === "chunk") {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "assistant") {
              updated[updated.length - 1] = {
                ...last,
                content: last.content + event.content,
              };
            }
            return updated;
          });
        } else if (event.type === "done") {
          setUsage(event.usage);
        } else if (event.type === "error") {
          setError(event.error);
        }
      });
      await loadConversations();
    } catch (err) {
      setError(err.message);
      setMessages((prev) => prev.slice(0, -2));
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        activeId={conversationId}
        onSelect={selectConversation}
        onNew={handleNewConversation}
      />
      <main className="chat-main">
        <header className="chat-header">
          <ModelSelect
            models={models}
            selectedModel={selectedModel}
            onChange={setSelectedModel}
            disabled={isStreaming}
            loading={isLoading}
          />
          <ExportMenu conversationId={conversationId} disabled={messages.length === 0} />
        </header>

        {error && <div className="error-banner">{error}</div>}

        <MessageList
          messages={messages}
          isStreaming={
            isStreaming &&
            (!messages.at(-1) ||
              messages.at(-1).role !== "assistant" ||
              !messages.at(-1).content)
          }
        />

        {usage && (
          <div className="usage-bar">
            Tokens: {usage.inputTokens} in / {usage.outputTokens} out
            &nbsp;·&nbsp; Est. cost: ${usage.estimatedCostUsd.toFixed(6)}
          </div>
        )}

        <ChatInput onSend={handleSend} disabled={isStreaming || !conversationId} />
      </main>
    </div>
  );
}
