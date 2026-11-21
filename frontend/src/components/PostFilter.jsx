export function PostFilter({ field, value, onChange }) {
  return (
    <label className="inline">
      Filter by {field}:
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`any ${field}`}
      />
    </label>
  );
}
