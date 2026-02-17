import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
  className?: string
}

export function FormField({ label, required, error, children, className }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-body font-medium mb-1">
        {label}{required && <span className="text-destructive"> *</span>}
      </label>
      {children}
      {error && <p className="text-sm text-destructive font-body mt-1">{error}</p>}
    </div>
  )
}
