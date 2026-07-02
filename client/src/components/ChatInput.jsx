export default function ChatInput({ onSend, disabled }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const input = e.target.elements.message;
    const value = input.value.trim();
    if (!value || disabled) return;
    onSend(value);
    input.value = "";
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <input
        name="message"
        type="text"
        placeholder="Ask a question..."
        disabled={disabled}
        autoComplete="off"
      />
      <button type="submit" disabled={disabled}>Send</button>
    </form>
  );
}
