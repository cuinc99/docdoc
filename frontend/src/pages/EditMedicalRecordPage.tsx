import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, X, Star, Search } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/types'
import { getMedicalRecord, updateMedicalRecord } from '@/api/medicalRecords'
import type { Diagnosis } from '@/api/medicalRecords'
import { searchIcd10 } from '@/api/icd10'
import type { Icd10Item } from '@/api/icd10'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Badge } from '@/components/retroui/Badge'
import { Input } from '@/components/retroui/Input'
import { useSnackbar } from '@/components/retroui/Snackbar'

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
  const [icdSearch, setIcdSearch] = useState('')
  const [showIcdDropdown, setShowIcdDropdown] = useState(false)

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

  const { data: icdData } = useQuery({
    queryKey: ['icd10', icdSearch],
    queryFn: () => searchIcd10(icdSearch),
    enabled: icdSearch.length >= 2,
  })

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
    mutationFn: (data: EditFormData) =>
      updateMedicalRecord(recordId, { ...data, diagnoses }),
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['medical-records'] })
      queryClient.invalidateQueries({ queryKey: ['medical-record', id] })
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

  const handleBack = useCallback(() => navigate(`/medical-records/${recordId}`), [navigate, recordId])

  const handleIcdSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIcdSearch(e.target.value)
    setShowIcdDropdown(e.target.value.length >= 2)
  }, [])

  const handleIcdBlur = useCallback(() => {
    setTimeout(() => setShowIcdDropdown(false), 200)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground font-body">Memuat data...</p>
      </div>
    )
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
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={handleBack} aria-label="Kembali">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <Text as="h1" className="text-2xl lg:text-3xl">Edit Rekam Medis</Text>
          <p className="text-sm text-muted-foreground font-body">
            {record.patient?.name} ({record.patient?.mr_number})
          </p>
        </div>
      </div>

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
                    className="p-1 text-destructive hover:bg-destructive/10 cursor-pointer"
                    aria-label={`Hapus diagnosis ${d.code}`}
                  >
                    <X className="w-4 h-4" />
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
