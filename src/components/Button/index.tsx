interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button className={`btn btn--${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}

export default Button
