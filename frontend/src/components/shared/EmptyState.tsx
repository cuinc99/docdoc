import type { ReactNode } from 'react'

interface EmptyStateProps {
  loading?: boolean
  message: string
  children?: ReactNode
}

export function EmptyState({ loading, message, children }: EmptyStateProps) {
  return (
    <div className="border-2 border-border p-8 text-center text-muted-foreground font-body">
      {loading ? 'Memuat data...' : message}
      {!loading && children}
    </div>
  )
}
