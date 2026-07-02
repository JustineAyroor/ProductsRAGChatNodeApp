const API = "/api";

async function parseError(res, fallback) {
  const err = await res.json().catch(() => ({ error: fallback }));
  return err.error || fallback;
}

export async function fetchModels() {
  try {
    const res = await fetch(`${API}/models`);
    if (!res.ok) throw new Error(await parseError(res, "Failed to load models"));
    return res.json();
  } catch (err) {
    if (err.message === "Failed to fetch") throw err;
    throw err;
  }
}

export async function fetchConversations() {
  const res = await fetch(`${API}/conversations`);
  if (!res.ok) throw new Error("Failed to load conversations");
  return res.json();
}

export async function createConversation() {
  const res = await fetch(`${API}/conversations`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to create conversation");
  return res.json();
}

export async function fetchConversation(id) {
  const res = await fetch(`${API}/conversations/${id}`);
  if (!res.ok) throw new Error("Failed to load conversation");
  return res.json();
}

export async function streamChat(id, message, model, onEvent) {
  const res = await fetch(`${API}/conversations/${id}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, model }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Chat request failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = JSON.parse(line.slice(6));
        onEvent(data);
        if (data.type === "error") {
          throw new Error(data.error || "Chat request failed");
        }
      }
    }
  }
}

export function exportConversation(id, format) {
  window.open(`${API}/conversations/${id}/export?format=${format}`, "_blank");
}
