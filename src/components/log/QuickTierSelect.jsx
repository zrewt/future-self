export default function QuickTierSelect({
  label,
  value,
  options,          // [{ value, label }]
  onSelect,         // (option) => void — receives the full option object
  columns = options?.length || 4,
}) {
  return (
    <div>
      {label && (
        <p className="text-xs font-semibold text-slate-500 dark:text-[#9EA1BD] mb-2">{label}</p>
      )}
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {options.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              data-selected={active}
              onClick={() => onSelect(opt)}
              className={`chip min-h-[42px] px-1 text-xs leading-tight border ${
                active
                  ? 'shadow-[0_2px_10px_rgba(109,92,231,0.25)]'
                  : 'bg-slate-50 text-slate-500 border-[#E2E8F0] dark:bg-[#242033] dark:text-[#9EA1BD] dark:border-[#3A3650]'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}