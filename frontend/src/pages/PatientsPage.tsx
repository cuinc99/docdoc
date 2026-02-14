import { useState, useCallback, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table'
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react'
import { getPatients } from '@/api/patients'
import type { Patient } from '@/api/patients'
import { useAuth } from '@/hooks/useAuth'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Input } from '@/components/retroui/Input'
import { Badge } from '@/components/retroui/Badge'
import { PatientDialog } from '@/components/patients/PatientDialog'
import { DeletePatientDialog } from '@/components/patients/DeletePatientDialog'

const columnHelper = createColumnHelper<Patient>()

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

  const canCreate = useMemo(() => user?.role === 'admin' || user?.role === 'receptionist', [user?.role])
  const canEdit = useMemo(() => user?.role === 'admin' || user?.role === 'receptionist', [user?.role])
  const canDelete = useMemo(() => user?.role === 'admin', [user?.role])

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

  const columns = useMemo(
    () => [
      columnHelper.accessor('mr_number', {
        header: 'No MR',
        cell: (info) => (
          <span className="font-mono text-sm">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('name', {
        header: 'Nama',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor('nik', {
        header: 'NIK',
        cell: (info) => <span className="font-mono text-sm">{info.getValue()}</span>,
      }),
      columnHelper.accessor('gender', {
        header: 'Gender',
        cell: (info) => (
          <Badge variant="default" size="sm">
            {info.getValue() === 'male' ? 'Laki-laki' : 'Perempuan'}
          </Badge>
        ),
      }),
      columnHelper.accessor('phone', {
        header: 'Telepon',
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(`/patients/${row.original.id}`)}
              className="p-1.5 border-2 border-border hover:bg-accent transition-colors cursor-pointer"
              title="Lihat Detail"
              aria-label={`Lihat detail ${row.original.name}`}
            >
              <Eye className="w-4 h-4" />
            </button>
            {canEdit && (
              <button
                onClick={() => setEditPatient(row.original)}
                className="p-1.5 border-2 border-border hover:bg-accent transition-colors cursor-pointer"
                title="Edit"
                aria-label={`Edit ${row.original.name}`}
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setDeleteTarget(row.original)}
                className="p-1.5 border-2 border-destructive text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                title="Hapus"
                aria-label={`Hapus ${row.original.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ),
      }),
    ],
    [canEdit, canDelete, navigate]
  )

  const tableData = useMemo(() => data?.data ?? [], [data?.data])

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <Text as="h1" className="text-2xl lg:text-3xl">Daftar Pasien</Text>
        {canCreate && (
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pasien
          </Button>
        )}
      </div>

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
        <Button type="submit" variant="secondary">Cari</Button>
      </form>

      <div className="border-2 border-border shadow-md overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b-2 border-border bg-primary/20">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-heading font-medium"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground font-body">
                  Memuat data...
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground font-body">
                  {search ? 'Tidak ada pasien ditemukan' : 'Belum ada data pasien'}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b-2 border-border hover:bg-accent/30 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm font-body">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
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
