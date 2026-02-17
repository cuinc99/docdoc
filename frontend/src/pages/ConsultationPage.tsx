import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Star, Search, Plus, Trash2 } from 'lucide-react'
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
import { searchIcd10 } from '@/api/icd10'
import type { Icd10Item } from '@/api/icd10'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Badge } from '@/components/retroui/Badge'
import { Input } from '@/components/retroui/Input'
import { useSnackbar } from '@/components/retroui/Snackbar'

interface DrugFormItem {
  drug_name: string
  dosage: string
  frequency: string
  duration: string
  quantity: string
  instructions: string
}

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
  const [icdSearch, setIcdSearch] = useState('')
  const [showIcdDropdown, setShowIcdDropdown] = useState(false)

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

  const { data: icdData } = useQuery({
    queryKey: ['icd10', icdSearch],
    queryFn: () => searchIcd10(icdSearch),
    enabled: icdSearch.length >= 2,
  })

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
    (item: Icd10Item) => {
      if (diagnoses.some((d) => d.code === item.code)) return
      setDiagnoses((prev) => [
        ...prev,
        { code: item.code, description: item.description, is_primary: prev.length === 0 },
      ])
      setIcdSearch('')
      setShowIcdDropdown(false)
    },
    [diagnoses]
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

  const handleIcdSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIcdSearch(e.target.value)
    setShowIcdDropdown(e.target.value.length >= 2)
  }, [])

  const handleIcdBlur = useCallback(() => {
    setTimeout(() => setShowIcdDropdown(false), 200)
  }, [])

  const handleAddDrug = useCallback(() => {
    setPrescriptionItems((prev) => [...prev, { drug_name: '', dosage: '', frequency: '', duration: '', quantity: '', instructions: '' }])
  }, [])

  const handleRemoveDrug = useCallback((index: number) => {
    setPrescriptionItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleDrugChange = useCallback((index: number, field: keyof DrugFormItem, value: string) => {
    setPrescriptionItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }, [])

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
          <Text as="h1" className="text-2xl lg:text-3xl">Konsultasi</Text>
          <p className="text-sm text-muted-foreground font-body">
            Antrian #{queue.queue_number} - {queue.patient?.name} ({queue.patient?.mr_number})
          </p>
        </div>
      </div>

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
            <div>
              <label className="block text-sm font-body mb-1 font-medium">
                Subjective <span className="text-destructive">*</span>
              </label>
              <textarea
                className={`px-4 py-2 w-full rounded border-2 shadow-md transition focus:outline-hidden focus:shadow-xs font-body min-h-[100px] resize-y ${
                  errors.subjective ? 'border-destructive' : ''
                }`}
                placeholder="Keluhan pasien..."
                {...register('subjective')}
              />
              {errors.subjective && <p className="text-xs text-destructive mt-1 font-body">{errors.subjective.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-body mb-1 font-medium">
                Objective <span className="text-destructive">*</span>
              </label>
              <textarea
                className={`px-4 py-2 w-full rounded border-2 shadow-md transition focus:outline-hidden focus:shadow-xs font-body min-h-[100px] resize-y ${
                  errors.objective ? 'border-destructive' : ''
                }`}
                placeholder="Hasil pemeriksaan fisik..."
                {...register('objective')}
              />
              {errors.objective && <p className="text-xs text-destructive mt-1 font-body">{errors.objective.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-body mb-1 font-medium">
                Assessment <span className="text-destructive">*</span>
              </label>
              <textarea
                className={`px-4 py-2 w-full rounded border-2 shadow-md transition focus:outline-hidden focus:shadow-xs font-body min-h-[100px] resize-y ${
                  errors.assessment ? 'border-destructive' : ''
                }`}
                placeholder="Diagnosis / penilaian..."
                {...register('assessment')}
              />
              {errors.assessment && <p className="text-xs text-destructive mt-1 font-body">{errors.assessment.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-body mb-1 font-medium">
                Plan <span className="text-destructive">*</span>
              </label>
              <textarea
                className={`px-4 py-2 w-full rounded border-2 shadow-md transition focus:outline-hidden focus:shadow-xs font-body min-h-[100px] resize-y ${
                  errors.plan ? 'border-destructive' : ''
                }`}
                placeholder="Rencana tindakan / terapi..."
                {...register('plan')}
              />
              {errors.plan && <p className="text-xs text-destructive mt-1 font-body">{errors.plan.message}</p>}
            </div>
          </div>
        </div>

        <div className="border-2 border-border p-4 shadow-md">
          <Text as="h2" className="text-lg mb-4">Diagnosis ICD-10</Text>

          <div className="relative mb-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari kode atau nama diagnosis ICD-10..."
                value={icdSearch}
                onChange={handleIcdSearchChange}
                onFocus={() => icdSearch.length >= 2 && setShowIcdDropdown(true)}
                onBlur={handleIcdBlur}
              />
            </div>
            {showIcdDropdown && icdData?.data && icdData.data.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 border-2 border-border bg-background shadow-lg max-h-60 overflow-y-auto">
                {icdData.data.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-accent transition-colors font-body text-sm cursor-pointer flex items-center gap-3"
                    onMouseDown={() => handleAddDiagnosis(item)}
                  >
                    <span className="font-mono font-medium shrink-0">{item.code}</span>
                    <span className="text-muted-foreground">{item.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {diagnoses.length > 0 ? (
            <div className="space-y-2">
              {diagnoses.map((d) => (
                <div key={d.code} className="flex items-center gap-2 border-2 border-border p-3">
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(d.code)}
                    className={`p-1 cursor-pointer ${d.is_primary ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-400'}`}
                    title={d.is_primary ? 'Diagnosis primer' : 'Jadikan diagnosis primer'}
                  >
                    <Star className="w-4 h-4" fill={d.is_primary ? 'currentColor' : 'none'} />
                  </button>
                  <span className="font-mono font-medium text-sm">{d.code}</span>
                  <span className="text-sm font-body flex-1">{d.description}</span>
                  {d.is_primary && <Badge size="sm" variant="default">Primer</Badge>}
                  <button
                    type="button"
                    onClick={() => handleRemoveDiagnosis(d.code)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-body text-destructive border-2 border-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    aria-label={`Hapus diagnosis ${d.code}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground font-body">
              Belum ada diagnosis. Cari dan tambahkan minimal 1 diagnosis.
            </p>
          )}
        </div>

        <div className="border-2 border-border p-4 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <Text as="h2" className="text-lg">Resep Obat</Text>
            <Button type="button" variant="outline" size="sm" onClick={handleAddDrug}>
              <Plus className="w-4 h-4 mr-1" /> Tambah Obat
            </Button>
          </div>

          {prescriptionItems.length > 0 ? (
            <div className="space-y-3">
              {prescriptionItems.map((item, index) => (
                <div key={index} className="border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-body font-medium">Obat {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDrug(index)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-body text-destructive border-2 border-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-body text-muted-foreground">Nama Obat *</label>
                      <Input
                        value={item.drug_name}
                        onChange={(e) => handleDrugChange(index, 'drug_name', e.target.value)}
                        placeholder="Nama obat"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-body text-muted-foreground">Dosis *</label>
                      <Input
                        value={item.dosage}
                        onChange={(e) => handleDrugChange(index, 'dosage', e.target.value)}
                        placeholder="cth: 500mg"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-body text-muted-foreground">Frekuensi *</label>
                      <Input
                        value={item.frequency}
                        onChange={(e) => handleDrugChange(index, 'frequency', e.target.value)}
                        placeholder="cth: 3x sehari"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-body text-muted-foreground">Durasi</label>
                      <Input
                        value={item.duration}
                        onChange={(e) => handleDrugChange(index, 'duration', e.target.value)}
                        placeholder="cth: 5 hari"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-body text-muted-foreground">Jumlah *</label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => handleDrugChange(index, 'quantity', e.target.value)}
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-body text-muted-foreground">Instruksi</label>
                      <Input
                        value={item.instructions}
                        onChange={(e) => handleDrugChange(index, 'instructions', e.target.value)}
                        placeholder="cth: Sesudah makan"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div>
                <label className="text-xs font-body text-muted-foreground">Catatan Resep</label>
                <textarea
                  className="px-4 py-2 w-full rounded border-2 shadow-md transition focus:outline-hidden focus:shadow-xs font-body min-h-[60px] resize-y"
                  placeholder="Catatan tambahan untuk resep..."
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground font-body">
              Belum ada item obat. Klik "Tambah Obat" untuk menambahkan resep.
            </p>
          )}
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
