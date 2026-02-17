import type { ReactNode, MouseEventHandler } from 'react'

interface ActionButtonProps {
  icon: ReactNode
  label: string
  onClick: MouseEventHandler<HTMLButtonElement>
  variant?: 'default' | 'destructive' | 'success'
  ariaLabel?: string
}

const variantClasses = {
  default: 'border-border hover:bg-accent',
  destructive: 'border-destructive text-destructive hover:bg-destructive/10',
  success: 'border-green-600 text-green-600 hover:bg-green-50',
}

export function ActionButton({ icon, label, onClick, variant = 'default', ariaLabel }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-body border-2 transition-colors cursor-pointer ${variantClasses[variant]}`}
      title={label}
      aria-label={ariaLabel ?? label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
