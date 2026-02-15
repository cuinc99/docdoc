import { useCallback, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { X } from 'lucide-react'
import { createSchedule, updateSchedule } from '@/api/schedules'
import type { Schedule, SchedulePayload } from '@/api/schedules'
import { getDoctors } from '@/api/doctors'
import type { ApiResponse } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Input } from '@/components/retroui/Input'
import { useSnackbar } from '@/components/retroui/Snackbar'

const scheduleSchema = z.object({
  doctor_id: z.number().min(1, 'Dokter wajib dipilih'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  start_time: z.string().min(1, 'Jam mulai wajib diisi'),
  end_time: z.string().min(1, 'Jam selesai wajib diisi'),
  notes: z.string().optional(),
})

type ScheduleForm = z.infer<typeof scheduleSchema>

interface ScheduleDialogProps {
  open: boolean
  onClose: () => void
  schedule?: Schedule
}

const selectClass =
  'px-4 py-2 w-full border-2 border-border shadow-md transition focus:outline-hidden focus:shadow-xs focus-visible:ring-2 focus-visible:ring-ring font-body bg-background cursor-pointer'
const textareaClass =
  'px-4 py-2 w-full border-2 border-border shadow-md transition focus:outline-hidden focus:shadow-xs focus-visible:ring-2 focus-visible:ring-ring font-body bg-background'

export function ScheduleDialog({ open, onClose, schedule }: ScheduleDialogProps) {
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const { user } = useAuth()
  const isEdit = !!schedule
  const isDoctor = user?.role === 'doctor'

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => getDoctors(),
    enabled: open && !isDoctor,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
  })

  useEffect(() => {
    if (!open) return
    if (schedule) {
      reset({
        doctor_id: schedule.doctor_id,
        date: schedule.date,
        start_time: schedule.start_time?.slice(0, 5),
        end_time: schedule.end_time?.slice(0, 5),
        notes: schedule.notes ?? '',
      })
    } else {
      reset({
        doctor_id: isDoctor ? (user?.id ?? 0) : 0,
        date: '',
        start_time: '',
        end_time: '',
        notes: '',
      })
    }
  }, [open, schedule, reset, isDoctor, user?.id])

  const mutation = useMutation({
    mutationFn: (data: SchedulePayload) =>
      isEdit ? updateSchedule(schedule.id, data) : createSchedule(data),
    onSuccess: (data) => {
      showSnackbar(data.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      onClose()
    },
    onError: (error: AxiosError<ApiResponse>) => {
      const message = error.response?.data?.message || 'Terjadi kesalahan'
      showSnackbar(message, 'error')
    },
  })

  const handleFormSubmit = useCallback(
    (data: ScheduleForm) => {
      const payload: SchedulePayload = {
        ...data,
        doctor_id: isDoctor ? user!.id : data.doctor_id,
        notes: data.notes || null,
      }
      mutation.mutate(payload)
    },
    [mutation, isDoctor, user]
  )

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Edit Jadwal' : 'Tambah Jadwal'}
        className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background border-2 border-border shadow-lg p-6 overscroll-contain"
      >
        <div className="flex items-center justify-between mb-4">
          <Text as="h2" className="text-xl">
            {isEdit ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
          </Text>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-border hover:bg-accent transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {isDoctor ? (
            <input type="hidden" {...register('doctor_id', { valueAsNumber: true })} value={user?.id} />
          ) : (
            <div>
              <label htmlFor="doctor_id" className="block text-sm font-medium mb-1 font-body">Dokter *</label>
              <select id="doctor_id" className={selectClass} autoComplete="off" aria-invalid={!!errors.doctor_id} {...register('doctor_id', { valueAsNumber: true })}>
                <option value="0">Pilih dokter</option>
                {doctorsData?.data?.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}{doc.specialization ? ` - ${doc.specialization}` : ''}
                  </option>
                ))}
              </select>
              {errors.doctor_id && <p className="text-destructive text-sm mt-1 font-body">{errors.doctor_id.message}</p>}
            </div>
          )}

          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-1 font-body">Tanggal *</label>
            <Input id="date" type="date" autoComplete="off" aria-invalid={!!errors.date} {...register('date')} />
            {errors.date && <p className="text-destructive text-sm mt-1 font-body">{errors.date.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_time" className="block text-sm font-medium mb-1 font-body">Jam Mulai *</label>
              <Input id="start_time" type="time" autoComplete="off" aria-invalid={!!errors.start_time} {...register('start_time')} />
              {errors.start_time && <p className="text-destructive text-sm mt-1 font-body">{errors.start_time.message}</p>}
            </div>
            <div>
              <label htmlFor="end_time" className="block text-sm font-medium mb-1 font-body">Jam Selesai *</label>
              <Input id="end_time" type="time" autoComplete="off" aria-invalid={!!errors.end_time} {...register('end_time')} />
              {errors.end_time && <p className="text-destructive text-sm mt-1 font-body">{errors.end_time.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1 font-body">Catatan</label>
            <textarea
              id="notes"
              rows={2}
              placeholder="Catatan tambahan (opsional)"
              className={textareaClass}
              autoComplete="off"
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Jadwal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
