interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

function Input({ label, error, ...props }: InputProps) {
  return (
    <div className="field">
      {label && <label className="field__label">{label}</label>}
      <input className={`field__input${error ? ' field__input--error' : ''}`} {...props} />
      {error && <span className="field__error">{error}</span>}
    </div>
  )
}

export default Input
