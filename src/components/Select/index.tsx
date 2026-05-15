interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  placeholder?: string
  options: SelectOption[]
  error?: string
}

function Select({ label, placeholder, options, error, ...props }: SelectProps) {
  return (
    <div className="field">
      {label && <label className="field__label">{label}</label>}
      <select className={`field__input${error ? ' field__input--error' : ''}`} {...props}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="field__error">{error}</span>}
    </div>
  )
}

export default Select
