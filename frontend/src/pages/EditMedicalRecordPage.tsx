import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/types'
import { getMedicalRecord, updateMedicalRecord } from '@/api/medicalRecords'
import type { Diagnosis } from '@/api/medicalRecords'
import { getPrescriptions, updatePrescription } from '@/api/prescriptions'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Textarea } from '@/components/retroui/Textarea'
import { useSnackbar } from '@/components/retroui/Snackbar'
import { PageHeader, EmptyState, FormField } from '@/components/shared'
import { DiagnosisSelector } from '@/components/medical/DiagnosisSelector'
import { PrescriptionItemsEditor } from '@/components/medical/PrescriptionItemsEditor'
import type { DrugFormItem } from '@/components/medical/PrescriptionItemsEditor'

const editSchema = z.object({
  subjective: z.string().min(1, 'Wajib diisi').max(10000),
  objective: z.string().min(1, 'Wajib diisi').max(10000),
  assessment: z.string().min(1, 'Wajib diisi').max(10000),
  plan: z.string().min(1, 'Wajib diisi').max(10000),
})

type EditFormData = z.infer<typeof editSchema>

export default function EditMedicalRecordPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const recordId = Number(id)

  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [diagnosesLoaded, setDiagnosesLoaded] = useState(false)

  const [prescriptionId, setPrescriptionId] = useState<number | null>(null)
  const [prescriptionItems, setPrescriptionItems] = useState<DrugFormItem[]>([])
  const [prescriptionNotes, setPrescriptionNotes] = useState('')
  const [prescriptionDispensed, setPrescriptionDispensed] = useState(false)
  const [prescriptionLoaded, setPrescriptionLoaded] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['medical-record', id],
    queryFn: () => getMedicalRecord(recordId),
    enabled: !!id,
  })

  const record = data?.data

  if (record && !diagnosesLoaded) {
    setDiagnoses(record.diagnoses)
    setDiagnosesLoaded(true)
  }

  const { data: prescriptionsData } = useQuery({
    queryKey: ['prescriptions', 'medical-record', recordId],
    queryFn: () => getPrescriptions({ medical_record_id: recordId }),
    enabled: !!record,
  })

  useEffect(() => {
    if (prescriptionsData && !prescriptionLoaded) {
      const rx = prescriptionsData.data?.[0]
      if (rx) {
        setPrescriptionId(rx.id)
        setPrescriptionDispensed(rx.is_dispensed)
        setPrescriptionItems(
          rx.items.map((item) => ({
            drug_name: item.drug_name,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration || '',
            quantity: String(item.quantity),
            instructions: item.instructions || '',
          }))
        )
        setPrescriptionNotes(rx.notes || '')
      }
      setPrescriptionLoaded(true)
    }
  }, [prescriptionsData, prescriptionLoaded])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    values: record ? {
      subjective: record.subjective,
      objective: record.objective,
      assessment: record.assessment,
      plan: record.plan,
    } : undefined,
  })

  const mutation = useMutation({
    mutationFn: async (data: EditFormData) => {
      const res = await updateMedicalRecord(recordId, { ...data, diagnoses })
      if (prescriptionId && !prescriptionDispensed) {
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
          await updatePrescription(prescriptionId, {
            items: validRxItems,
            notes: prescriptionNotes || null,
          })
        }
      }
      return res
    },
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['medical-records'] })
      queryClient.invalidateQueries({ queryKey: ['medical-record', id] })
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
      navigate(`/medical-records/${recordId}`)
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal memperbarui rekam medis', 'error')
    },
  })

  const onSubmit = useCallback(
    (data: EditFormData) => {
      if (diagnoses.length === 0) {
        showSnackbar('Minimal 1 diagnosis wajib ditambahkan', 'error')
        return
      }
      if (!diagnoses.some((d) => d.is_primary)) {
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

  const handleBack = useCallback(() => navigate(`/medical-records/${recordId}`), [navigate, recordId])

  if (isLoading) {
    return <EmptyState loading message="" />
  }

  if (isError || !record) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-muted-foreground font-body">Rekam medis tidak ditemukan</p>
        <Button variant="outline" onClick={() => navigate('/medical-records')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </div>
    )
  }

  if (record.is_locked) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-muted-foreground font-body">Rekam medis ini sudah terkunci dan tidak dapat diedit</p>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Detail
        </Button>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Edit Rekam Medis"
        subtitle={`${record.patient?.name} (${record.patient?.mr_number})`}
        onBack={handleBack}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="border-2 border-border p-4 shadow-md">
          <Text as="h2" className="text-lg mb-4">SOAP</Text>
          <div className="space-y-4">
            <FormField label="Subjective" required error={errors.subjective?.message}>
              <Textarea
                aria-invalid={!!errors.subjective}
                {...register('subjective')}
              />
            </FormField>
            <FormField label="Objective" required error={errors.objective?.message}>
              <Textarea
                aria-invalid={!!errors.objective}
                {...register('objective')}
              />
            </FormField>
            <FormField label="Assessment" required error={errors.assessment?.message}>
              <Textarea
                aria-invalid={!!errors.assessment}
                {...register('assessment')}
              />
            </FormField>
            <FormField label="Plan" required error={errors.plan?.message}>
              <Textarea
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

        {prescriptionLoaded && prescriptionId && (
          <div className="border-2 border-border p-4 shadow-md">
            <PrescriptionItemsEditor
              items={prescriptionItems}
              notes={prescriptionNotes}
              onItemsChange={setPrescriptionItems}
              onNotesChange={setPrescriptionNotes}
              disabled={prescriptionDispensed}
            />
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleBack}>
            Batal
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </div>
  )
}
