import { Dialog } from '@/components/retroui/Dialog'
import { Button } from '@/components/retroui/Button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'destructive' | 'default'
  isPending?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  variant = 'destructive',
  isPending = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-sm font-body text-muted-foreground mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant="default"
          className={variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          onClick={onConfirm}
          disabled={isPending}
        >
          {isPending ? 'Memproses...' : confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}
