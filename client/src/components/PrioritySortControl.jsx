// Presentational only. Option values and labels come from the caller so this
// component does not define the sort API contract (owned by #153).
export default function PrioritySortControl({ options = [], value, onChange }) {
  return (
    <label>
      Sort by
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
