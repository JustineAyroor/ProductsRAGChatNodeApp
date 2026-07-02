import { useEffect, useRef } from "react";

export default function MessageList({ messages, isStreaming }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="empty-state">
        <h2>Employee Assistant</h2>
        <p>Ask questions about our products, policies, and support procedures.</p>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.filter((m) => m.content).map((msg, i) => (
        <div key={i} className={`message message--${msg.role}`}>
          <div className="message-role">{msg.role === "user" ? "You" : "Assistant"}</div>
          <div className="message-content">{msg.content}</div>
        </div>
      ))}
      {isStreaming && (
        <div className="message message--assistant">
          <div className="message-role">Assistant</div>
          <div className="message-content typing">Thinking...</div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
