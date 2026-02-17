import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Lock, Unlock, Plus, Edit, Star, Trash2 } from 'lucide-react'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/types'
import { getMedicalRecord, createAddendum, updateAddendum, deleteAddendum } from '@/api/medicalRecords'
import { useAuth } from '@/hooks/useAuth'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Badge } from '@/components/retroui/Badge'
import { Card } from '@/components/retroui/Card'
import { useSnackbar } from '@/components/retroui/Snackbar'

const TIMEZONE = 'Asia/Makassar'

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  })
}

export default function MedicalRecordDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { showSnackbar } = useSnackbar()

  const [addendumOpen, setAddendumOpen] = useState(false)
  const [addendumContent, setAddendumContent] = useState('')
  const [editingAddendumId, setEditingAddendumId] = useState<number | null>(null)
  const [editingAddendumContent, setEditingAddendumContent] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['medical-record', id],
    queryFn: () => getMedicalRecord(Number(id)),
    enabled: !!id,
  })

  const record = data?.data

  const canEdit = record && !record.is_locked && (user?.role === 'admin' || user?.role === 'doctor')
  const canAddendum = record && (user?.role === 'admin' || user?.role === 'doctor')

  const addendumMutation = useMutation({
    mutationFn: (content: string) => createAddendum(Number(id), content),
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['medical-record', id] })
      setAddendumOpen(false)
      setAddendumContent('')
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal menambahkan addendum', 'error')
    },
  })

  const updateAddendumMutation = useMutation({
    mutationFn: ({ addendumId, content }: { addendumId: number; content: string }) =>
      updateAddendum(Number(id), addendumId, content),
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['medical-record', id] })
      setEditingAddendumId(null)
      setEditingAddendumContent('')
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal memperbarui addendum', 'error')
    },
  })

  const deleteAddendumMutation = useMutation({
    mutationFn: (addendumId: number) => deleteAddendum(Number(id), addendumId),
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['medical-record', id] })
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal menghapus addendum', 'error')
    },
  })

  const canModifyAddendum = useCallback(
    (addendumDoctorId: number) => user?.role === 'admin' || user?.id === addendumDoctorId,
    [user]
  )

  const handleBack = useCallback(() => navigate('/medical-records'), [navigate])
  const handleEdit = useCallback(() => navigate(`/medical-records/${id}/edit`), [navigate, id])
  const handleSubmitAddendum = useCallback(() => {
    if (!addendumContent.trim()) {
      showSnackbar('Konten addendum wajib diisi', 'error')
      return
    }
    addendumMutation.mutate(addendumContent)
  }, [addendumContent, addendumMutation, showSnackbar])
  const handleOpenAddendum = useCallback(() => setAddendumOpen(true), [])
  const handleCloseAddendum = useCallback(() => {
    setAddendumOpen(false)
    setAddendumContent('')
  }, [])
  const handleAddendumChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAddendumContent(e.target.value)
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
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </div>
    )
  }

  const vs = record.vital_sign

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleBack} aria-label="Kembali">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <Text as="h1" className="text-2xl lg:text-3xl">Detail Rekam Medis</Text>
            <p className="text-sm text-muted-foreground font-body">
              {record.patient?.name} ({record.patient?.mr_number})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {record.is_locked ? (
            <Badge className="bg-gray-100 text-gray-600">
              <Lock className="w-3 h-3 mr-1" /> Terkunci
            </Badge>
          ) : (
            <Badge className="bg-green-100 text-green-800">
              <Unlock className="w-3 h-3 mr-1" /> Terbuka
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="w-full">
          <Card.Header>
            <Card.Title>Informasi</Card.Title>
          </Card.Header>
          <Card.Content>
            <dl className="space-y-2 font-body text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Pasien</dt>
                <dd className="font-medium">{record.patient?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">No. RM</dt>
                <dd className="font-mono">{record.patient?.mr_number}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Dokter</dt>
                <dd>Dr. {record.doctor?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tanggal</dt>
                <dd>{formatDateTime(record.created_at)}</dd>
              </div>
              {record.locked_at && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Dikunci pada</dt>
                  <dd>{formatDateTime(record.locked_at)}</dd>
                </div>
              )}
            </dl>
          </Card.Content>
        </Card>

        {vs && (
          <Card className="w-full">
            <Card.Header>
              <Card.Title>Tanda Vital</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-2 gap-2 font-body text-sm">
                <div>
                  <span className="text-muted-foreground">TD</span>
                  <p className="font-medium">{vs.systolic}/{vs.diastolic} mmHg</p>
                </div>
                <div>
                  <span className="text-muted-foreground">HR</span>
                  <p className="font-medium">{vs.heart_rate} bpm</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Suhu</span>
                  <p className="font-medium">{vs.temperature}&deg;C</p>
                </div>
                <div>
                  <span className="text-muted-foreground">RR</span>
                  <p className="font-medium">{vs.respiratory_rate}x/mnt</p>
                </div>
                {vs.oxygen_saturation && (
                  <div>
                    <span className="text-muted-foreground">SpO2</span>
                    <p className="font-medium">{vs.oxygen_saturation}%</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">BMI</span>
                  <p className="font-medium">{vs.bmi} ({vs.weight}kg / {vs.height}cm)</p>
                </div>
              </div>
            </Card.Content>
          </Card>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <Card className="w-full">
          <Card.Header>
            <Card.Title>SOAP</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4 font-body text-sm">
              <div>
                <h4 className="font-heading font-medium mb-1">Subjective</h4>
                <p className="whitespace-pre-wrap">{record.subjective}</p>
              </div>
              <div>
                <h4 className="font-heading font-medium mb-1">Objective</h4>
                <p className="whitespace-pre-wrap">{record.objective}</p>
              </div>
              <div>
                <h4 className="font-heading font-medium mb-1">Assessment</h4>
                <p className="whitespace-pre-wrap">{record.assessment}</p>
              </div>
              <div>
                <h4 className="font-heading font-medium mb-1">Plan</h4>
                <p className="whitespace-pre-wrap">{record.plan}</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card className="w-full">
          <Card.Header>
            <Card.Title>Diagnosis ICD-10</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-2">
              {record.diagnoses.map((d) => (
                <div key={d.code} className="flex items-center gap-2 font-body text-sm">
                  {d.is_primary && <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />}
                  <span className="font-mono font-medium">{d.code}</span>
                  <span>{d.description}</span>
                  {d.is_primary && <Badge size="sm" variant="default">Primer</Badge>}
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>

        {record.addendums && record.addendums.length > 0 && (
          <Card className="w-full">
            <Card.Header>
              <Card.Title>Addendum</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                {record.addendums.map((a) => (
                  <div key={a.id} className="border-l-4 border-border pl-3 font-body text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Dr. {a.doctor?.name}</span>
                        <span>&bull;</span>
                        <span>{formatDateTime(a.created_at)}</span>
                      </div>
                      {canModifyAddendum(a.doctor_id) && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditingAddendumId(a.id); setEditingAddendumContent(a.content) }}
                            className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Edit Addendum"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { if (confirm('Hapus addendum ini?')) deleteAddendumMutation.mutate(a.id) }}
                            className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Hapus Addendum"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    {editingAddendumId === a.id ? (
                      <div className="mt-2">
                        <textarea
                          className="px-3 py-2 w-full rounded border-2 shadow-md transition focus:outline-hidden focus:shadow-xs font-body min-h-[80px] resize-y mb-2"
                          value={editingAddendumContent}
                          onChange={(e) => setEditingAddendumContent(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setEditingAddendumId(null); setEditingAddendumContent('') }}>
                            Batal
                          </Button>
                          <Button
                            size="sm"
                            disabled={updateAddendumMutation.isPending}
                            onClick={() => updateAddendumMutation.mutate({ addendumId: a.id, content: editingAddendumContent })}
                          >
                            {updateAddendumMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{a.content}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        )}
      </div>

      <div className="flex justify-end gap-3">
        {canEdit && (
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Rekam Medis
          </Button>
        )}
        {canAddendum && (
          <Button onClick={handleOpenAddendum}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Addendum
          </Button>
        )}
      </div>

      {addendumOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={handleCloseAddendum} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tambah Addendum"
            className="relative z-10 w-full max-w-lg bg-background border-2 border-border shadow-lg p-6"
          >
            <Text as="h2" className="text-xl mb-2">Tambah Addendum</Text>
            {record.is_locked && (
              <p className="text-sm text-muted-foreground font-body mb-4">
                Rekam medis ini sudah terkunci. Anda hanya bisa menambah addendum.
              </p>
            )}
            <textarea
              className="px-4 py-2 w-full rounded border-2 shadow-md transition focus:outline-hidden focus:shadow-xs font-body min-h-[120px] resize-y mb-4"
              placeholder="Tulis addendum..."
              value={addendumContent}
              onChange={handleAddendumChange}
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleCloseAddendum}>
                Batal
              </Button>
              <Button onClick={handleSubmitAddendum} disabled={addendumMutation.isPending}>
                {addendumMutation.isPending ? 'Menyimpan...' : 'Simpan Addendum'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
