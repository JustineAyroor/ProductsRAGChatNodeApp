export default function ModelSelect({ models, selectedModel, onChange, disabled, loading }) {
  const isEmpty = models.length === 0;

  return (
    <div className="model-select">
      <label htmlFor="model">Model</label>
      <select
        id="model"
        value={selectedModel}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading || isEmpty}
      >
        {loading && <option value="">Loading models...</option>}
        {!loading && isEmpty && <option value="">No models available</option>}
        {models.map((m) => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>
    </div>
  );
}
