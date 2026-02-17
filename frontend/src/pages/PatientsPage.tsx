import { useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import { getPatients } from '@/api/patients'
import type { Patient } from '@/api/patients'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/retroui/Button'
import { Badge } from '@/components/retroui/Badge'
import { PatientDialog } from '@/components/patients/PatientDialog'
import { DeletePatientDialog } from '@/components/patients/DeletePatientDialog'
import { PageHeader, EmptyState, ActionButton, SearchBar, Pagination } from '@/components/shared'
import { formatDateId } from '@/lib/utils'

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
      <PageHeader title="Pasien">
        {canCreate && (
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pasien
          </Button>
        )}
      </PageHeader>

      <div className="mb-4">
        <SearchBar
          value={searchInput}
          onChange={(v) => setSearchInput(v)}
          onSearch={handleSearch}
          placeholder="Cari nama, NIK, No MR, atau telepon..."
        />
      </div>

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
                  {patient.birth_date ? ` · ${formatDateId(patient.birth_date)}` : ''}
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

      {data?.meta && <Pagination meta={data.meta} onPageChange={handlePageChange} />}

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
