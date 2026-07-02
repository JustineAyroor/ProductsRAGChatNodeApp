import { exportConversation } from "../api";

export default function ExportMenu({ conversationId, disabled }) {
  if (!conversationId) return null;

  return (
    <div className="export-menu">
      <button
        disabled={disabled}
        onClick={() => exportConversation(conversationId, "json")}
      >
        Export JSON
      </button>
      <button
        disabled={disabled}
        onClick={() => exportConversation(conversationId, "csv")}
      >
        Export CSV
      </button>
    </div>
  );
}
