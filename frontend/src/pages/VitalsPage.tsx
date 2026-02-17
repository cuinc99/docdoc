import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/types'
import { getQueue } from '@/api/queues'
import { createVitalSign, updateVitalSign, getVitalSigns, deleteVitalSign } from '@/api/vitalSigns'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Input } from '@/components/retroui/Input'
import { Textarea } from '@/components/retroui/Textarea'
import { useSnackbar } from '@/components/retroui/Snackbar'
import { PageHeader, EmptyState, FormField, ConfirmDialog } from '@/components/shared'

const vitalSignSchema = z.object({
  systolic: z.number({ error: 'Wajib diisi' }).int().min(60).max(300),
  diastolic: z.number({ error: 'Wajib diisi' }).int().min(30).max(200),
  heart_rate: z.number({ error: 'Wajib diisi' }).int().min(30).max(250),
  temperature: z.number({ error: 'Wajib diisi' }).min(30).max(45),
  respiratory_rate: z.number({ error: 'Wajib diisi' }).int().min(5).max(60),
  oxygen_saturation: z.number().int().min(50).max(100).nullable().optional(),
  weight: z.number({ error: 'Wajib diisi' }).min(1).max(500),
  height: z.number({ error: 'Wajib diisi' }).min(30).max(300),
  chief_complaint: z.string().min(1, 'Wajib diisi').max(5000),
  notes: z.string().max(5000).nullable().optional(),
})

type VitalSignFormData = z.infer<typeof vitalSignSchema>

function calcBmi(weight: number, height: number): string {
  if (weight > 0 && height > 0) {
    const h = height / 100
    return (weight / (h * h)).toFixed(1)
  }
  return '-'
}

function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'bg-blue-100 text-blue-800' }
  if (bmi < 25) return { label: 'Normal', color: 'bg-green-100 text-green-800' }
  if (bmi < 30) return { label: 'Overweight', color: 'bg-yellow-100 text-yellow-800' }
  return { label: 'Obesitas', color: 'bg-red-100 text-red-800' }
}

export default function VitalsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const queueId = Number(id)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['queue', queueId],
    queryFn: () => getQueue(queueId),
    enabled: !!id,
  })

  const queue = queueData?.data ?? null

  const { data: existingVitals } = useQuery({
    queryKey: ['vital-signs', 'queue', queueId],
    queryFn: () => getVitalSigns({ queue_id: queueId }),
    enabled: !!id,
  })

  const existingVital = existingVitals?.data?.[0] ?? null
  const isEdit = !!existingVital

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<VitalSignFormData>({
    resolver: zodResolver(vitalSignSchema),
    values: existingVital ? {
      systolic: existingVital.systolic,
      diastolic: existingVital.diastolic,
      heart_rate: existingVital.heart_rate,
      temperature: Number(existingVital.temperature),
      respiratory_rate: existingVital.respiratory_rate,
      oxygen_saturation: existingVital.oxygen_saturation,
      weight: Number(existingVital.weight),
      height: Number(existingVital.height),
      chief_complaint: existingVital.chief_complaint,
      notes: existingVital.notes ?? '',
    } : undefined,
    defaultValues: {
      oxygen_saturation: null,
      notes: '',
    },
  })

  const watchWeight = watch('weight')
  const watchHeight = watch('height')
  const bmiValue = calcBmi(watchWeight || 0, watchHeight || 0)
  const bmiNum = parseFloat(bmiValue)
  const bmiInfo = !isNaN(bmiNum) ? bmiCategory(bmiNum) : null

  const mutation = useMutation({
    mutationFn: (data: VitalSignFormData) =>
      isEdit
        ? updateVitalSign(existingVital.id, data)
        : createVitalSign({ ...data, queue_id: queueId }),
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['queues'] })
      queryClient.invalidateQueries({ queryKey: ['vital-signs'] })
      navigate('/queue')
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal menyimpan tanda vital', 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteVitalSign(existingVital!.id),
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['queues'] })
      queryClient.invalidateQueries({ queryKey: ['vital-signs'] })
      navigate('/queue')
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal menghapus tanda vital', 'error')
    },
  })

  const onSubmit = useCallback(
    (data: VitalSignFormData) => {
      mutation.mutate(data)
    },
    [mutation]
  )

  const handleBack = useCallback(() => navigate('/queue'), [navigate])

  if (queueLoading) {
    return <EmptyState loading message="" />
  }

  if (!queue) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-muted-foreground font-body">Antrian tidak ditemukan</p>
        <Button variant="outline" onClick={handleBack}>
          Kembali
        </Button>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Tanda Vital' : 'Input Tanda Vital'}
        subtitle={`Antrian #${queue.queue_number} - ${queue.patient?.name} (${queue.patient?.mr_number})`}
        onBack={handleBack}
      />

      <div className="border-2 border-border p-4 shadow-md mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-body text-sm">
          <div>
            <span className="text-muted-foreground">Pasien</span>
            <p className="font-medium">{queue.patient?.name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">No. RM</span>
            <p className="font-mono">{queue.patient?.mr_number}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Dokter</span>
            <p className="font-medium">Dr. {queue.doctor?.name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">No. Antrian</span>
            <p className="font-bold">{queue.queue_number}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="border-2 border-border p-4 shadow-md">
          <Text as="h2" className="text-lg mb-4">Tekanan Darah &amp; Jantung</Text>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Sistolik (mmHg)" required error={errors.systolic?.message}>
              <Input
                type="number"
                placeholder="120"
                aria-invalid={!!errors.systolic}
                {...register('systolic', { valueAsNumber: true })}
              />
            </FormField>
            <FormField label="Diastolik (mmHg)" required error={errors.diastolic?.message}>
              <Input
                type="number"
                placeholder="80"
                aria-invalid={!!errors.diastolic}
                {...register('diastolic', { valueAsNumber: true })}
              />
            </FormField>
            <FormField label="Detak Jantung (bpm)" required error={errors.heart_rate?.message}>
              <Input
                type="number"
                placeholder="72"
                aria-invalid={!!errors.heart_rate}
                {...register('heart_rate', { valueAsNumber: true })}
              />
            </FormField>
          </div>
        </div>

        <div className="border-2 border-border p-4 shadow-md">
          <Text as="h2" className="text-lg mb-4">Pernapasan &amp; Suhu</Text>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Suhu Tubuh (°C)" required error={errors.temperature?.message}>
              <Input
                type="number"
                step="0.1"
                placeholder="36.5"
                aria-invalid={!!errors.temperature}
                {...register('temperature', { valueAsNumber: true })}
              />
            </FormField>
            <FormField label="Frekuensi Napas (/menit)" required error={errors.respiratory_rate?.message}>
              <Input
                type="number"
                placeholder="18"
                aria-invalid={!!errors.respiratory_rate}
                {...register('respiratory_rate', { valueAsNumber: true })}
              />
            </FormField>
            <FormField label="SpO2 (%)" error={errors.oxygen_saturation?.message}>
              <Input
                type="number"
                placeholder="98"
                aria-invalid={!!errors.oxygen_saturation}
                {...register('oxygen_saturation', {
                  setValueAs: (v: string) => (v === '' ? null : Number(v)),
                })}
              />
            </FormField>
          </div>
        </div>

        <div className="border-2 border-border p-4 shadow-md">
          <Text as="h2" className="text-lg mb-4">Antropometri</Text>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Berat Badan (kg)" required error={errors.weight?.message}>
              <Input
                type="number"
                step="0.01"
                placeholder="70"
                aria-invalid={!!errors.weight}
                {...register('weight', { valueAsNumber: true })}
              />
            </FormField>
            <FormField label="Tinggi Badan (cm)" required error={errors.height?.message}>
              <Input
                type="number"
                step="0.01"
                placeholder="170"
                aria-invalid={!!errors.height}
                {...register('height', { valueAsNumber: true })}
              />
            </FormField>
            <div>
              <label className="block text-sm font-body font-medium mb-1">BMI</label>
              <div className="px-4 py-2 w-full border-2 border-border shadow-md bg-muted flex items-center gap-2">
                <span className="font-heading font-bold text-lg">{bmiValue}</span>
                {bmiInfo && (
                  <span className={`text-xs px-2 py-0.5 rounded font-body ${bmiInfo.color}`}>
                    {bmiInfo.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-2 border-border p-4 shadow-md">
          <Text as="h2" className="text-lg mb-4">Keluhan</Text>
          <div className="space-y-4">
            <FormField label="Keluhan Utama" required error={errors.chief_complaint?.message}>
              <Textarea
                placeholder="Deskripsikan keluhan utama pasien..."
                aria-invalid={!!errors.chief_complaint}
                {...register('chief_complaint')}
              />
            </FormField>
            <FormField label="Catatan Tambahan">
              <Textarea
                placeholder="Catatan tambahan (opsional)..."
                className="min-h-[80px]"
                {...register('notes')}
              />
            </FormField>
          </div>
        </div>

        <div className="flex justify-between">
          {isEdit ? (
            <Button type="button" variant="outline" onClick={() => setShowDeleteConfirm(true)} disabled={deleteMutation.isPending} className="text-destructive border-destructive hover:bg-destructive/10">
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus Tanda Vital'}
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleBack}>
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Tanda Vital'}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => { deleteMutation.mutate(); setShowDeleteConfirm(false); }}
        title="Hapus Tanda Vital"
        message="Apakah Anda yakin ingin menghapus data tanda vital ini?"
        confirmLabel="Hapus"
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
