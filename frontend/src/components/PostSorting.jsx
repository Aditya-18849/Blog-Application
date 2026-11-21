export function PostSorting({ fields = [], value, onChange, orderValue, onOrderChange }) {
  return (
    <label className="inline">
      Sort by:
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {fields.map((field) => (
          <option key={field} value={field}>
            {field}
          </option>
        ))}
      </select>
      <select value={orderValue} onChange={(e) => onOrderChange(e.target.value)}>
        <option value="ascending">ascending</option>
        <option value="descending">descending</option>
      </select>
    </label>
  );
}
