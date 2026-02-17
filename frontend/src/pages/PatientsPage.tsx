import { useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react'
import { getPatients } from '@/api/patients'
import type { Patient } from '@/api/patients'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/retroui/Button'
import { Input } from '@/components/retroui/Input'
import { Badge } from '@/components/retroui/Badge'
import { PatientDialog } from '@/components/patients/PatientDialog'
import { DeletePatientDialog } from '@/components/patients/DeletePatientDialog'
import { PageHeader, EmptyState, ActionButton } from '@/components/shared'

export default function PatientsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') || '1')
  const search = searchParams.get('search') || ''

  const [searchInput, setSearchInput] = useState(search)
  const [createOpen, setCreateOpen] = useState(false)
  const [editPatient, setEditPatient] = useState<Patient | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null)

  const canCreate = user?.role === 'admin' || user?.role === 'receptionist'
  const canEdit = user?.role === 'admin' || user?.role === 'receptionist'
  const canDelete = user?.role === 'admin'

  const { data, isLoading } = useQuery({
    queryKey: ['patients', page, search],
    queryFn: () => getPatients({ page, per_page: 10, search: search || undefined }),
  })

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setSearchParams(searchInput ? { search: searchInput, page: '1' } : {})
    },
    [searchInput, setSearchParams]
  )

  const handleSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value),
    []
  )

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params: Record<string, string> = { page: String(newPage) }
      if (search) params.search = search
      setSearchParams(params)
    },
    [search, setSearchParams]
  )

  const handleOpenCreate = useCallback(() => setCreateOpen(true), [])
  const handleCloseCreate = useCallback(() => setCreateOpen(false), [])
  const handleCloseEdit = useCallback(() => setEditPatient(undefined), [])
  const handleCloseDelete = useCallback(() => setDeleteTarget(null), [])

  const patients = data?.data ?? []

  return (
    <div>
      <PageHeader title="Daftar Pasien">
        {canCreate && (
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pasien
          </Button>
        )}
      </PageHeader>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, NIK, No MR, atau telepon..."
            value={searchInput}
            onChange={handleSearchInputChange}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">Cari</Button>
      </form>

      <div className="space-y-3">
        {isLoading ? (
          <EmptyState loading message="" />
        ) : patients.length === 0 ? (
          <EmptyState message={search ? 'Tidak ada pasien ditemukan' : 'Belum ada data pasien'} />
        ) : (
          patients.map((patient) => (
            <div
              key={patient.id}
              className="border-2 border-border p-4 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-heading font-medium">{patient.name}</span>
                  <span className="text-xs font-mono text-muted-foreground">{patient.mr_number}</span>
                  <Badge variant="default" size="sm">
                    {patient.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-body">
                  NIK: {patient.nik}
                  {patient.phone ? ` · ${patient.phone}` : ''}
                  {patient.birth_date ? ` · ${new Date(patient.birth_date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                  {patient.address ? ` · ${patient.address}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <ActionButton
                  icon={<Eye className="w-4 h-4" />}
                  label="Detail"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                />
                {canEdit && (
                  <ActionButton
                    icon={<Pencil className="w-4 h-4" />}
                    label="Edit"
                    onClick={() => setEditPatient(patient)}
                  />
                )}
                {canDelete && (
                  <ActionButton
                    icon={<Trash2 className="w-4 h-4" />}
                    label="Hapus"
                    variant="destructive"
                    onClick={() => setDeleteTarget(patient)}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {data?.meta && data.meta.last_page > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          <p className="text-sm text-muted-foreground font-body">
            Menampilkan {data.data.length} dari {data.meta.total} pasien
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={data.meta.current_page <= 1}
              onClick={() => handlePageChange(data.meta.current_page - 1)}
            >
              Sebelumnya
            </Button>
            {Array.from({ length: data.meta.last_page }, (_, i) => i + 1)
              .filter((p) => {
                const current = data.meta.current_page
                return p === 1 || p === data.meta.last_page || Math.abs(p - current) <= 1
              })
              .map((p, idx, arr) => {
                const showEllipsis = idx > 0 && p - arr[idx - 1] > 1
                return (
                  <span key={p} className="flex items-center">
                    {showEllipsis && <span className="px-2 text-muted-foreground font-body">...</span>}
                    <Button
                      variant={p === data.meta.current_page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </Button>
                  </span>
                )
              })}
            <Button
              variant="outline"
              size="sm"
              disabled={data.meta.current_page >= data.meta.last_page}
              onClick={() => handlePageChange(data.meta.current_page + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      <PatientDialog open={createOpen} onClose={handleCloseCreate} />
      <PatientDialog
        open={!!editPatient}
        onClose={handleCloseEdit}
        patient={editPatient}
      />
      <DeletePatientDialog
        open={!!deleteTarget}
        onClose={handleCloseDelete}
        patient={deleteTarget}
      />
    </div>
  )
}
