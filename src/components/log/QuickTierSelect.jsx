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
          <p className="text-xs font-semibold text-slate-500 mb-2">{label}</p>
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
                onClick={() => onSelect(opt)}
                className={`min-h-[42px] rounded-xl px-1 text-xs font-bold leading-tight transition-all duration-150 border ${
                  active
                    ? 'text-white border-transparent'
                    : 'bg-slate-50 text-slate-500 border-[rgba(109,40,217,0.10)] hover:bg-[#7c3aed]/5 hover:border-[#7c3aed]/30'
                }`}
                style={
                  active
                    ? {
                        background: 'linear-gradient(135deg, #ff7ac6, #7c3aed, #00cdb4)',
                        boxShadow: '0 2px 10px rgba(124,58,237,0.25)',
                      }
                    : undefined
                }
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }