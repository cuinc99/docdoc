import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type SnackbarVariant = 'success' | 'error' | 'warning' | 'info'

interface SnackbarItem {
  id: number
  message: string
  variant: SnackbarVariant
}

interface SnackbarContextValue {
  showSnackbar: (message: string, variant?: SnackbarVariant) => void
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null)

let idCounter = 0

const variantStyles: Record<SnackbarVariant, string> = {
  success: 'bg-primary text-primary-foreground',
  error: 'bg-destructive text-destructive-foreground',
  warning: 'bg-accent text-accent-foreground',
  info: 'bg-secondary text-secondary-foreground',
}

const variantIcons: Record<SnackbarVariant, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

function SnackbarMessage({ item, onDismiss }: { item: SnackbarItem; onDismiss: (id: number) => void }) {
  const Icon = variantIcons[item.variant]

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), 4000)
    return () => clearTimeout(timer)
  }, [item.id, onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-3 px-4 py-3 border-2 border-border shadow-md font-body text-sm animate-slide-in',
        variantStyles[item.variant],
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="flex-1 font-medium">{item.message}</span>
      <button
        onClick={() => onDismiss(item.id)}
        className="p-0.5 hover:opacity-70 transition-opacity cursor-pointer shrink-0"
        aria-label="Tutup"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SnackbarItem[]>([])

  const showSnackbar = useCallback((message: string, variant: SnackbarVariant = 'success') => {
    const id = ++idCounter
    setItems((prev) => [...prev.slice(-4), { id, message, variant }])
  }, [])

  const handleDismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const value = useMemo(() => ({ showSnackbar }), [showSnackbar])

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {items.map((item) => (
          <div key={item.id} className="pointer-events-auto">
            <SnackbarMessage item={item} onDismiss={handleDismiss} />
          </div>
        ))}
      </div>
    </SnackbarContext.Provider>
  )
}

export function useSnackbar() {
  const context = useContext(SnackbarContext)
  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider')
  }
  return context
}
