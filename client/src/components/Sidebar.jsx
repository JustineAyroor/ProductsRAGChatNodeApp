export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Chatbot</h1>
        <button className="btn-new" onClick={onNew}>+ New conversation</button>
      </div>
      <div className="conversation-list">
        {conversations.length === 0 && (
          <p className="sidebar-empty">No conversations yet</p>
        )}
        {conversations.map((c) => (
          <button
            key={c.id}
            className={`conversation-item${c.id === activeId ? " active" : ""}`}
            onClick={() => onSelect(c.id)}
          >
            <span className="conversation-title">{c.title}</span>
            <span className="conversation-meta">{c.messageCount} messages</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
