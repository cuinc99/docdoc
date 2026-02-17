import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/types'
import { getQueue } from '@/api/queues'
import { getVitalSigns } from '@/api/vitalSigns'
import { createMedicalRecord } from '@/api/medicalRecords'
import type { Diagnosis } from '@/api/medicalRecords'
import { createPrescription } from '@/api/prescriptions'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Textarea } from '@/components/retroui/Textarea'
import { useSnackbar } from '@/components/retroui/Snackbar'
import { PageHeader, EmptyState, FormField } from '@/components/shared'
import { DiagnosisSelector } from '@/components/medical/DiagnosisSelector'
import { PrescriptionItemsEditor } from '@/components/medical/PrescriptionItemsEditor'
import type { DrugFormItem } from '@/components/medical/PrescriptionItemsEditor'

const consultationSchema = z.object({
  subjective: z.string().min(1, 'Wajib diisi').max(10000),
  objective: z.string().min(1, 'Wajib diisi').max(10000),
  assessment: z.string().min(1, 'Wajib diisi').max(10000),
  plan: z.string().min(1, 'Wajib diisi').max(10000),
})

type ConsultationFormData = z.infer<typeof consultationSchema>

export default function ConsultationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const queueId = Number(id)

  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])

  const [prescriptionItems, setPrescriptionItems] = useState<DrugFormItem[]>([])
  const [prescriptionNotes, setPrescriptionNotes] = useState('')

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['queue', queueId],
    queryFn: () => getQueue(queueId),
    enabled: !!id,
  })

  const queue = queueData?.data ?? null

  const { data: vitalsData } = useQuery({
    queryKey: ['vital-signs', 'queue', queueId],
    queryFn: () => getVitalSigns({ queue_id: queueId }),
    enabled: !!id,
  })

  const vitalSign = vitalsData?.data?.[0] ?? null

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      objective: vitalSign
        ? `TD: ${vitalSign.systolic}/${vitalSign.diastolic} mmHg, HR: ${vitalSign.heart_rate} bpm, T: ${vitalSign.temperature}°C, RR: ${vitalSign.respiratory_rate}x/mnt${vitalSign.oxygen_saturation ? `, SpO2: ${vitalSign.oxygen_saturation}%` : ''}, BB: ${vitalSign.weight} kg, TB: ${vitalSign.height} cm, BMI: ${vitalSign.bmi}`
        : '',
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: ConsultationFormData) => {
      const res = await createMedicalRecord({
        ...data,
        queue_id: queueId,
        diagnoses,
      })
      const validRxItems = prescriptionItems
        .filter((item) => item.drug_name && item.dosage && item.frequency && (parseInt(item.quantity) || 0) > 0)
        .map((item) => ({
          drug_name: item.drug_name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration || null,
          quantity: parseInt(item.quantity) || 1,
          instructions: item.instructions || null,
        }))
      if (validRxItems.length > 0) {
        await createPrescription({
          medical_record_id: res.data.id,
          items: validRxItems,
          notes: prescriptionNotes || null,
        })
      }
      return res
    },
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['queues'] })
      queryClient.invalidateQueries({ queryKey: ['medical-records'] })
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
      navigate(`/medical-records/${res.data.id}`)
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal menyimpan rekam medis', 'error')
    },
  })

  const onSubmit = useCallback(
    (data: ConsultationFormData) => {
      if (diagnoses.length === 0) {
        showSnackbar('Minimal 1 diagnosis wajib ditambahkan', 'error')
        return
      }
      const hasPrimary = diagnoses.some((d) => d.is_primary)
      if (!hasPrimary) {
        showSnackbar('Pilih satu diagnosis sebagai diagnosis primer', 'error')
        return
      }
      mutation.mutate(data)
    },
    [mutation, diagnoses, showSnackbar]
  )

  const handleAddDiagnosis = useCallback(
    (diagnosis: Diagnosis) => {
      setDiagnoses((prev) => [...prev, diagnosis])
    },
    []
  )

  const handleRemoveDiagnosis = useCallback((code: string) => {
    setDiagnoses((prev) => {
      const filtered = prev.filter((d) => d.code !== code)
      if (filtered.length > 0 && !filtered.some((d) => d.is_primary)) {
        filtered[0].is_primary = true
      }
      return filtered
    })
  }, [])

  const handleSetPrimary = useCallback((code: string) => {
    setDiagnoses((prev) =>
      prev.map((d) => ({ ...d, is_primary: d.code === code }))
    )
  }, [])

  const handleBack = useCallback(() => navigate('/queue'), [navigate])

  if (queueLoading) {
    return <EmptyState loading message="" />
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
      <PageHeader
        title="Konsultasi"
        subtitle={`Antrian #${queue.queue_number} - ${queue.patient?.name} (${queue.patient?.mr_number})`}
        onBack={handleBack}
      />

      {vitalSign && (
        <div className="border-2 border-border p-4 shadow-md mb-6">
          <Text as="h2" className="text-base mb-3">Tanda Vital</Text>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 font-body text-sm">
            <div>
              <span className="text-muted-foreground">TD</span>
              <p className="font-medium">{vitalSign.systolic}/{vitalSign.diastolic} mmHg</p>
            </div>
            <div>
              <span className="text-muted-foreground">HR</span>
              <p className="font-medium">{vitalSign.heart_rate} bpm</p>
            </div>
            <div>
              <span className="text-muted-foreground">Suhu</span>
              <p className="font-medium">{vitalSign.temperature}&deg;C</p>
            </div>
            <div>
              <span className="text-muted-foreground">RR</span>
              <p className="font-medium">{vitalSign.respiratory_rate}x/mnt</p>
            </div>
            {vitalSign.oxygen_saturation && (
              <div>
                <span className="text-muted-foreground">SpO2</span>
                <p className="font-medium">{vitalSign.oxygen_saturation}%</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">BB/TB</span>
              <p className="font-medium">{vitalSign.weight} kg / {vitalSign.height} cm</p>
            </div>
            <div>
              <span className="text-muted-foreground">BMI</span>
              <p className="font-medium">{vitalSign.bmi}</p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Keluhan Utama</span>
              <p className="font-medium">{vitalSign.chief_complaint}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="border-2 border-border p-4 shadow-md">
          <Text as="h2" className="text-lg mb-4">SOAP</Text>
          <div className="space-y-4">
            <FormField label="Subjective" required error={errors.subjective?.message}>
              <Textarea
                placeholder="Keluhan pasien..."
                aria-invalid={!!errors.subjective}
                {...register('subjective')}
              />
            </FormField>
            <FormField label="Objective" required error={errors.objective?.message}>
              <Textarea
                placeholder="Hasil pemeriksaan fisik..."
                aria-invalid={!!errors.objective}
                {...register('objective')}
              />
            </FormField>
            <FormField label="Assessment" required error={errors.assessment?.message}>
              <Textarea
                placeholder="Diagnosis / penilaian..."
                aria-invalid={!!errors.assessment}
                {...register('assessment')}
              />
            </FormField>
            <FormField label="Plan" required error={errors.plan?.message}>
              <Textarea
                placeholder="Rencana tindakan / terapi..."
                aria-invalid={!!errors.plan}
                {...register('plan')}
              />
            </FormField>
          </div>
        </div>

        <div className="border-2 border-border p-4 shadow-md">
          <Text as="h2" className="text-lg mb-4">Diagnosis ICD-10</Text>
          <DiagnosisSelector
            diagnoses={diagnoses}
            onAdd={handleAddDiagnosis}
            onRemove={handleRemoveDiagnosis}
            onSetPrimary={handleSetPrimary}
          />
        </div>

        <div className="border-2 border-border p-4 shadow-md">
          <PrescriptionItemsEditor
            items={prescriptionItems}
            notes={prescriptionNotes}
            onItemsChange={setPrescriptionItems}
            onNotesChange={setPrescriptionNotes}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleBack}>
            Batal
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Menyimpan...' : 'Simpan Rekam Medis'}
          </Button>
        </div>
      </form>
    </div>
  )
}
