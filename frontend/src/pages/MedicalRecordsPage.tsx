import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, Lock, Unlock } from 'lucide-react'
import { getMedicalRecords } from '@/api/medicalRecords'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader, EmptyState, ActionButton, SearchBar, Pagination } from '@/components/shared'
import { formatDateId } from '@/lib/utils'

export default function MedicalRecordsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['medical-records', page, searchQuery],
    queryFn: () =>
      getMedicalRecords({
        page,
        per_page: 10,
        ...(user?.role === 'doctor' ? { doctor_id: user.id } : {}),
        ...(searchQuery ? { search: searchQuery } : {}),
      }),
  })

  const records = data?.data ?? []
  const meta = data?.meta

  const handleView = useCallback(
    (id: number) => navigate(`/medical-records/${id}`),
    [navigate]
  )

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setSearchQuery(search)
      setPage(1)
    },
    [search]
  )

  const getPrimaryDiagnosis = (diagnoses: Array<{ code: string; description: string; is_primary: boolean }>) => {
    const primary = diagnoses.find((d) => d.is_primary)
    return primary ? `${primary.code} - ${primary.description}` : diagnoses[0]?.code ?? '-'
  }

  return (
    <div>
      <PageHeader title="Rekam Medis" />

      <div className="mb-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          onSearch={handleSearch}
          placeholder="Cari pasien (nama / no. RM)..."
        />
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <EmptyState loading message="" />
        ) : records.length === 0 ? (
          <EmptyState message={searchQuery ? 'Tidak ada rekam medis ditemukan' : 'Belum ada rekam medis'} />
        ) : (
          records.map((record) => (
            <div
              key={record.id}
              className="border-2 border-border p-4 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-heading font-medium">{record.patient?.name}</span>
                  <span className="text-xs font-mono text-muted-foreground">{record.patient?.mr_number}</span>
                  {record.is_locked ? (
                    <span className="inline-flex items-center gap-1 text-xs font-body px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                      <Lock className="w-3 h-3" /> Terkunci
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-body px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                      <Unlock className="w-3 h-3" /> Terbuka
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-body">
                  {formatDateId(record.created_at)} · Dr. {record.doctor?.name}
                </p>
                <p className="text-sm font-body mt-0.5">{getPrimaryDiagnosis(record.diagnoses)}</p>
              </div>
              <div className="flex items-center gap-1">
                <ActionButton
                  icon={<Eye className="w-4 h-4" />}
                  label="Detail"
                  onClick={() => handleView(record.id)}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  )
}
