import { useState, useCallback, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { AxiosError } from 'axios'
import { X, Search } from 'lucide-react'
import { createQueue } from '@/api/queues'
import type { QueuePayload } from '@/api/queues'
import { getDoctors } from '@/api/doctors'
import { getPatients } from '@/api/patients'
import type { ApiResponse } from '@/types'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Input } from '@/components/retroui/Input'
import { useSnackbar } from '@/components/retroui/Snackbar'

const queueSchema = z.object({
  patient_id: z.number().min(1, 'Pasien wajib dipilih'),
  doctor_id: z.number().min(1, 'Dokter wajib dipilih'),
  priority: z.enum(['normal', 'urgent']),
})

type QueueForm = z.infer<typeof queueSchema>

interface AddQueueDialogProps {
  open: boolean
  onClose: () => void
  date: string
}

const selectClass =
  'px-4 py-2 w-full border-2 border-border shadow-md transition focus:outline-hidden focus:shadow-xs focus-visible:ring-2 focus-visible:ring-ring font-body bg-background cursor-pointer'

export function AddQueueDialog({ open, onClose, date }: AddQueueDialogProps) {
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const [patientSearch, setPatientSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(patientSearch), 300)
    return () => clearTimeout(timer)
  }, [patientSearch])

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => getDoctors(),
    enabled: open,
  })

  const { data: patientsData } = useQuery({
    queryKey: ['patients-search', debouncedSearch],
    queryFn: () => getPatients({ search: debouncedSearch || undefined, per_page: 10 }),
    enabled: open,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<QueueForm>({
    resolver: zodResolver(queueSchema),
    defaultValues: {
      patient_id: 0,
      doctor_id: 0,
      priority: 'normal',
    },
  })

  useEffect(() => {
    if (open) {
      reset({ patient_id: 0, doctor_id: 0, priority: 'normal' })
      setPatientSearch('')
      setDebouncedSearch('')
    }
  }, [open, reset])

  const selectedPatientId = watch('patient_id')

  const mutation = useMutation({
    mutationFn: (data: QueuePayload) => createQueue(data),
    onSuccess: (data) => {
      showSnackbar(data.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['queues'] })
      onClose()
    },
    onError: (error: AxiosError<ApiResponse>) => {
      const message = error.response?.data?.message || 'Terjadi kesalahan'
      showSnackbar(message, 'error')
    },
  })

  const handleFormSubmit = useCallback(
    (data: QueueForm) => {
      mutation.mutate({ ...data, date })
    },
    [mutation, date]
  )

  const handlePatientSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setPatientSearch(e.target.value),
    []
  )

  const handleSelectPatient = useCallback(
    (id: number) => {
      setValue('patient_id', id)
    },
    [setValue]
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

  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tambah ke Antrian"
        className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background border-2 border-border shadow-lg p-6 overscroll-contain"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <Text as="h2" className="text-xl">Tambah ke Antrian</Text>
            <p className="text-sm text-muted-foreground font-body">{dateLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-border hover:bg-accent transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 font-body">Cari Pasien *</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NIK, atau No MR..."
                value={patientSearch}
                onChange={handlePatientSearchChange}
                className="pl-10"
                autoComplete="off"
              />
            </div>
            <input type="hidden" {...register('patient_id')} />
            {errors.patient_id && <p className="text-destructive text-sm mt-1 font-body">{errors.patient_id.message}</p>}

            <div className="border-2 border-border max-h-40 overflow-y-auto">
              {patientsData?.data?.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => handleSelectPatient(patient.id)}
                  className={`w-full text-left px-3 py-2 text-sm font-body hover:bg-accent transition-colors cursor-pointer border-b border-border last:border-b-0 ${
                    selectedPatientId === patient.id ? 'bg-primary/20 font-medium' : ''
                  }`}
                >
                  <span className="font-medium">{patient.name}</span>
                  <span className="text-muted-foreground ml-2">({patient.mr_number})</span>
                </button>
              ))}
              {patientsData?.data?.length === 0 && (
                <p className="px-3 py-2 text-sm text-muted-foreground font-body">Tidak ada pasien ditemukan</p>
              )}
            </div>
          </div>

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

          <div>
            <label htmlFor="priority" className="block text-sm font-medium mb-1 font-body">Prioritas</label>
            <select id="priority" className={selectClass} autoComplete="off" {...register('priority')}>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Menambahkan...' : 'Tambah ke Antrian'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
