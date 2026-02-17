import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, Check, Download, ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react'
import { getPrescriptions, dispensePrescription, downloadPrescriptionPdf } from '@/api/prescriptions'
import type { Prescription } from '@/api/prescriptions'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/retroui/Button'
import { Input } from '@/components/retroui/Input'
import { useSnackbar } from '@/components/retroui/Snackbar'
import { PageHeader, EmptyState, ActionButton } from '@/components/shared'
import { formatDateId, selectClass } from '@/lib/utils'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/types'

export default function PrescriptionsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [detail, setDetail] = useState<Prescription | null>(null)
  const [confirmDispense, setConfirmDispense] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['prescriptions', page, filter, searchQuery],
    queryFn: () =>
      getPrescriptions({
        page,
        per_page: 10,
        ...(filter === 'dispensed' ? { is_dispensed: true } : {}),
        ...(filter === 'pending' ? { is_dispensed: false } : {}),
        ...(searchQuery ? { search: searchQuery } : {}),
      }),
  })

  const prescriptions = data?.data ?? []
  const meta = data?.meta

  const dispenseMutation = useMutation({
    mutationFn: dispensePrescription,
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
      setConfirmDispense(null)
      setDetail(null)
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal menebus resep', 'error')
    },
  })

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value)
    setPage(1)
  }, [])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(search)
    setPage(1)
  }, [search])

  const handlePrevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), [])
  const handleNextPage = useCallback(
    () => setPage((p) => (meta && p < meta.last_page ? p + 1 : p)),
    [meta]
  )

  const handleDownloadPdf = useCallback(async (id: number) => {
    try {
      await downloadPrescriptionPdf(id)
    } catch {
      showSnackbar('Gagal mengunduh PDF', 'error')
    }
  }, [showSnackbar])

  const canDispense = user?.role === 'admin' || user?.role === 'receptionist'

  return (
    <div>
      <PageHeader title="Resep Obat" />

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari nama pasien atau nomor resep..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">Cari</Button>
        </form>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select value={filter} onChange={handleFilterChange} className={selectClass + ' min-w-[160px]'}>
            <option value="all">Semua Resep</option>
            <option value="pending">Belum Ditebus</option>
            <option value="dispensed">Sudah Ditebus</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <EmptyState loading message="" />
        ) : prescriptions.length === 0 ? (
          <EmptyState message="Belum ada resep obat" />
        ) : (
          prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="border-2 border-border p-4 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-heading font-medium font-mono text-sm">{rx.prescription_number}</span>
                  {rx.is_dispensed ? (
                    <span className="inline-flex items-center gap-1 text-xs font-body px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                      <Check className="w-3 h-3" /> Sudah Ditebus
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-body px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200">
                      Belum Ditebus
                    </span>
                  )}
                </div>
                <p className="text-sm font-body">
                  <span className="font-medium">{rx.patient?.name}</span>
                  <span className="text-muted-foreground"> ({rx.patient?.mr_number})</span>
                </p>
                <p className="text-sm text-muted-foreground font-body">
                  {formatDateId(rx.created_at)} · Dr. {rx.doctor?.name}
                  {' · '}{rx.items.length} item obat
                </p>
              </div>
              <div className="flex items-center gap-1">
                <ActionButton
                  icon={<Eye className="w-4 h-4" />}
                  label="Detail"
                  onClick={() => setDetail(rx)}
                />
                {canDispense && !rx.is_dispensed && (
                  <ActionButton
                    icon={<Check className="w-4 h-4" />}
                    label="Tebus"
                    variant="success"
                    onClick={() => setConfirmDispense(rx.id)}
                  />
                )}
                <ActionButton
                  icon={<Download className="w-4 h-4" />}
                  label="PDF"
                  onClick={() => handleDownloadPdf(rx.id)}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground font-body">
            Hal {meta.current_page} dari {meta.last_page} ({meta.total} data)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={page <= 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={page >= meta.last_page}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div
            className="bg-background border-2 border-border shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b-2 border-border flex items-center justify-between">
              <div>
                <p className="font-heading font-medium">{detail.prescription_number}</p>
                <p className="text-xs text-muted-foreground font-body">{formatDateId(detail.created_at)}</p>
              </div>
              {detail.is_dispensed ? (
                <span className="inline-flex items-center gap-1 text-xs font-body px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                  <Check className="w-3 h-3" /> Sudah Ditebus
                </span>
              ) : (
                <span className="text-xs font-body px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200">
                  Belum Ditebus
                </span>
              )}
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm font-body">
                <div>
                  <span className="text-muted-foreground">Pasien</span>
                  <p className="font-medium">{detail.patient?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Dokter</span>
                  <p className="font-medium">Dr. {detail.doctor?.name}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium font-body mb-2">Daftar Obat</p>
                <div className="space-y-2">
                  {detail.items.map((item, i) => (
                    <div key={i} className="border border-border p-3 text-sm font-body">
                      <p className="font-medium">{i + 1}. {item.drug_name}</p>
                      <div className="grid grid-cols-2 gap-1 mt-1 text-muted-foreground">
                        <span>Dosis: {item.dosage}</span>
                        <span>Frekuensi: {item.frequency}</span>
                        <span>Durasi: {item.duration || '-'}</span>
                        <span>Jumlah: {item.quantity}</span>
                      </div>
                      {item.instructions && (
                        <p className="mt-1 text-muted-foreground">Instruksi: {item.instructions}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {detail.notes && (
                <div>
                  <p className="text-sm font-medium font-body">Catatan</p>
                  <p className="text-sm text-muted-foreground font-body">{detail.notes}</p>
                </div>
              )}

              {detail.dispensed_by_user && (
                <p className="text-xs text-muted-foreground font-body">
                  Ditebus oleh: {detail.dispensed_by_user.name}
                </p>
              )}
            </div>

            <div className="p-4 border-t-2 border-border flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(detail.id)}>
                <Download className="w-4 h-4 mr-1" /> PDF
              </Button>
              {canDispense && !detail.is_dispensed && (
                <Button size="sm" onClick={() => setConfirmDispense(detail.id)}>
                  <Check className="w-4 h-4 mr-1" /> Tebus Resep
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setDetail(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmDispense !== null && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={() => setConfirmDispense(null)}>
          <div
            className="bg-background border-2 border-border shadow-lg p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-heading font-medium mb-2">Tebus Resep?</p>
            <p className="text-sm text-muted-foreground font-body mb-4">
              Resep yang sudah ditebus tidak dapat dibatalkan atau diedit lagi. Lanjutkan?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmDispense(null)}>
                Batal
              </Button>
              <Button
                size="sm"
                onClick={() => dispenseMutation.mutate(confirmDispense)}
                disabled={dispenseMutation.isPending}
              >
                {dispenseMutation.isPending ? 'Memproses...' : 'Ya, Tebus'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
