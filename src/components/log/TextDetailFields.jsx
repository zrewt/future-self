export function TextField({ label, value, onChange, placeholder, multiline = false }) {
  const className = multiline
    ? 'input-field text-sm min-h-[72px] resize-none'
    : 'input-field text-sm'

  return (
    <div>
      {label && <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{label}</label>}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
          rows={3}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
        />
      )}
    </div>
  )
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field text-sm appearance-none cursor-pointer"
      >
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
