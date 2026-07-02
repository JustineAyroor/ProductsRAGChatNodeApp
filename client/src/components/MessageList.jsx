import { useEffect, useMemo, useRef, useState } from "react";

export default function MessageList({ messages, isStreaming }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">✦</div>
        <h2>Employee Assistant</h2>
        <p>Ask about products, pricing, support procedures, policies, or onboarding.</p>
        <div className="prompt-suggestions" aria-label="Example prompts">
          <span>List our products</span>
          <span>Compare CloudSync and TeamFlow</span>
          <span>What is the refund policy?</span>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.filter((m) => m.content).map((msg, i) => (
        <div key={i} className={`message message--${msg.role}`}>
          <div className="message-avatar" aria-hidden="true">
            {msg.role === "user" ? "You" : "AI"}
          </div>
          <div className="message-body">
            <div className="message-meta">
              <span className="message-role">
                {msg.role === "user" ? "You" : "Assistant"}
              </span>
              {msg.role === "assistant" && <CopyButton text={msg.content} />}
            </div>
            <div className="message-content">
              <FormattedMessage content={msg.content} />
            </div>
          </div>
        </div>
      ))}
      {isStreaming && (
        <div className="message message--assistant">
          <div className="message-avatar" aria-hidden="true">AI</div>
          <div className="message-body">
            <div className="message-meta">
              <span className="message-role">Assistant</span>
            </div>
            <div className="message-content typing">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button className="copy-message" type="button" onClick={handleCopy}>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function FormattedMessage({ content }) {
  const blocks = useMemo(() => parseBlocks(content), [content]);

  return blocks.map((block, index) => {
    if (block.type === "code") {
      return (
        <pre className="message-code" key={index}>
          <code>{block.text}</code>
        </pre>
      );
    }

    if (block.type === "ul") {
      return (
        <ul key={index}>
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{item}</li>
          ))}
        </ul>
      );
    }

    if (block.type === "ol") {
      return (
        <ol key={index}>
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{item}</li>
          ))}
        </ol>
      );
    }

    return <p key={index}>{block.text}</p>;
  });
}

function parseBlocks(content) {
  const lines = String(content || "").split(/\r?\n/);
  const blocks = [];
  let paragraph = [];
  let list = null;
  let code = null;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() });
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      flushParagraph();
      flushList();
      if (code) {
        blocks.push({ type: "code", text: code.join("\n") });
        code = null;
      } else {
        code = [];
      }
      continue;
    }

    if (code) {
      code.push(line);
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const unordered = trimmed.match(/^[-*]\s+(.+)/);
    if (unordered) {
      flushParagraph();
      if (!list || list.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(unordered[1]);
      continue;
    }

    const ordered = trimmed.match(/^\d+[.)]\s+(.+)/);
    if (ordered) {
      flushParagraph();
      if (!list || list.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(ordered[1]);
      continue;
    }

    flushList();
    paragraph.push(trimmed.replace(/^#{1,6}\s+/, ""));
  }

  flushParagraph();
  flushList();
  if (code) blocks.push({ type: "code", text: code.join("\n") });

  return blocks.length > 0 ? blocks : [{ type: "paragraph", text: "" }];
}
