import { useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Trash2 } from 'lucide-react'
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
import { useSnackbar } from '@/components/retroui/Snackbar'

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

  const handleDelete = useCallback(() => {
    if (confirm('Hapus tanda vital pasien ini?')) {
      deleteMutation.mutate()
    }
  }, [deleteMutation])

  const onSubmit = useCallback(
    (data: VitalSignFormData) => {
      mutation.mutate(data)
    },
    [mutation]
  )

  const handleBack = useCallback(() => navigate('/queue'), [navigate])

  if (queueLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground font-body">Memuat data...</p>
      </div>
    )
  }

  if (!queue) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-muted-foreground font-body">Antrian tidak ditemukan</p>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={handleBack} aria-label="Kembali ke antrian">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <Text as="h1" className="text-2xl lg:text-3xl">{isEdit ? 'Edit Tanda Vital' : 'Input Tanda Vital'}</Text>
          <p className="text-sm text-muted-foreground font-body">
            Antrian #{queue.queue_number} - {queue.patient?.name} ({queue.patient?.mr_number})
          </p>
        </div>
      </div>

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
          <Text as="h2" className="text-lg mb-4">Tekanan Darah & Jantung</Text>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-body mb-1">
                Sistolik (mmHg) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                placeholder="120"
                aria-invalid={!!errors.systolic}
                {...register('systolic', { valueAsNumber: true })}
              />
              {errors.systolic && <p className="text-xs text-destructive mt-1 font-body">{errors.systolic.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-body mb-1">
                Diastolik (mmHg) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                placeholder="80"
                aria-invalid={!!errors.diastolic}
                {...register('diastolic', { valueAsNumber: true })}
              />
              {errors.diastolic && <p className="text-xs text-destructive mt-1 font-body">{errors.diastolic.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-body mb-1">
                Detak Jantung (bpm) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                placeholder="72"
                aria-invalid={!!errors.heart_rate}
                {...register('heart_rate', { valueAsNumber: true })}
              />
              {errors.heart_rate && <p className="text-xs text-destructive mt-1 font-body">{errors.heart_rate.message}</p>}
            </div>
          </div>
        </div>

        <div className="border-2 border-border p-4 shadow-md">
          <Text as="h2" className="text-lg mb-4">Pernapasan & Suhu</Text>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-body mb-1">
                Suhu Tubuh (&deg;C) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="36.5"
                aria-invalid={!!errors.temperature}
                {...register('temperature', { valueAsNumber: true })}
              />
              {errors.temperature && <p className="text-xs text-destructive mt-1 font-body">{errors.temperature.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-body mb-1">
                Frekuensi Napas (/menit) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                placeholder="18"
                aria-invalid={!!errors.respiratory_rate}
                {...register('respiratory_rate', { valueAsNumber: true })}
              />
              {errors.respiratory_rate && <p className="text-xs text-destructive mt-1 font-body">{errors.respiratory_rate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-body mb-1">SpO2 (%)</label>
              <Input
                type="number"
                placeholder="98"
                aria-invalid={!!errors.oxygen_saturation}
                {...register('oxygen_saturation', {
                  setValueAs: (v: string) => (v === '' ? null : Number(v)),
                })}
              />
              {errors.oxygen_saturation && <p className="text-xs text-destructive mt-1 font-body">{errors.oxygen_saturation.message}</p>}
            </div>
          </div>
        </div>

        <div className="border-2 border-border p-4 shadow-md">
          <Text as="h2" className="text-lg mb-4">Antropometri</Text>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-body mb-1">
                Berat Badan (kg) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="70"
                aria-invalid={!!errors.weight}
                {...register('weight', { valueAsNumber: true })}
              />
              {errors.weight && <p className="text-xs text-destructive mt-1 font-body">{errors.weight.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-body mb-1">
                Tinggi Badan (cm) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="170"
                aria-invalid={!!errors.height}
                {...register('height', { valueAsNumber: true })}
              />
              {errors.height && <p className="text-xs text-destructive mt-1 font-body">{errors.height.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-body mb-1">BMI</label>
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
            <div>
              <label className="block text-sm font-body mb-1">
                Keluhan Utama <span className="text-destructive">*</span>
              </label>
              <textarea
                className={`px-4 py-2 w-full rounded border-2 shadow-md transition focus:outline-hidden focus:shadow-xs font-body min-h-[100px] resize-y ${
                  errors.chief_complaint ? 'border-destructive text-destructive shadow-xs shadow-destructive' : ''
                }`}
                placeholder="Deskripsikan keluhan utama pasien..."
                aria-invalid={!!errors.chief_complaint}
                {...register('chief_complaint')}
              />
              {errors.chief_complaint && <p className="text-xs text-destructive mt-1 font-body">{errors.chief_complaint.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-body mb-1">Catatan Tambahan</label>
              <textarea
                className="px-4 py-2 w-full rounded border-2 shadow-md transition focus:outline-hidden focus:shadow-xs font-body min-h-[80px] resize-y"
                placeholder="Catatan tambahan (opsional)..."
                {...register('notes')}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          {isEdit ? (
            <Button type="button" variant="outline" onClick={handleDelete} disabled={deleteMutation.isPending} className="text-destructive border-destructive hover:bg-destructive/10">
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
    </div>
  )
}
