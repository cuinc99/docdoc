import { useCallback, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { deleteSchedule } from '@/api/schedules'
import type { Schedule } from '@/api/schedules'
import type { ApiResponse } from '@/types'
import { Button } from '@/components/retroui/Button'
import { Text } from '@/components/retroui/Text'
import { useSnackbar } from '@/components/retroui/Snackbar'

interface DeleteScheduleDialogProps {
  open: boolean
  onClose: () => void
  schedule: Schedule | null
}

export function DeleteScheduleDialog({ open, onClose, schedule }: DeleteScheduleDialogProps) {
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()

  const mutation = useMutation({
    mutationFn: () => deleteSchedule(schedule!.id),
    onSuccess: (data) => {
      showSnackbar(data.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      onClose()
    },
    onError: (error: AxiosError<ApiResponse>) => {
      const message = error.response?.data?.message || 'Gagal menghapus jadwal'
      showSnackbar(message, 'error')
    },
  })

  const handleDelete = useCallback(() => {
    mutation.mutate()
  }, [mutation])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open || !schedule) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Hapus Jadwal"
        className="relative z-10 w-full max-w-md bg-background border-2 border-border shadow-lg p-6 overscroll-contain"
      >
        <Text as="h2" className="text-xl mb-3">Hapus Jadwal</Text>
        <p className="font-body text-muted-foreground mb-1">
          Apakah Anda yakin ingin menghapus jadwal berikut?
        </p>
        <p className="font-body font-medium mb-4">
          {schedule.doctor?.name} - {schedule.date} ({schedule.start_time?.slice(0, 5)} - {schedule.end_time?.slice(0, 5)})
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Batal
          </Button>
          <Button
            onClick={handleDelete}
            disabled={mutation.isPending}
            className="bg-destructive text-destructive-foreground border-border shadow-destructive hover:bg-destructive/90"
          >
            {mutation.isPending ? 'Menghapus...' : 'Hapus'}
          </Button>
        </div>
      </div>
    </div>
  )
}
