import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, Plus, ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react'
import { getInvoices } from '@/api/invoices'
import { Button } from '@/components/retroui/Button'
import { Input } from '@/components/retroui/Input'
import { PageHeader, EmptyState, ActionButton } from '@/components/shared'
import { formatDateId, selectClass } from '@/lib/utils'

const statusLabels: Record<string, string> = {
  pending: 'Belum Dibayar',
  partial: 'Sebagian',
  paid: 'Lunas',
  cancelled: 'Dibatalkan',
}

const statusClasses: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  partial: 'bg-blue-50 text-blue-700 border-blue-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

function formatRupiah(value: string | number) {
  return 'Rp ' + Number(value).toLocaleString('id-ID')
}

export default function BillingPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, statusFilter, searchQuery],
    queryFn: () =>
      getInvoices({
        page,
        per_page: 10,
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(searchQuery ? { search: searchQuery } : {}),
      }),
  })

  const invoices = data?.data ?? []
  const meta = data?.meta

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value)
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

  return (
    <div>
      <PageHeader title="Billing">
        <Button onClick={() => navigate('/billing/create')}>
          <Plus className="w-4 h-4 mr-1" /> Buat Invoice
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari nama pasien atau nomor invoice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">Cari</Button>
        </form>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select value={statusFilter} onChange={handleFilterChange} className={selectClass + ' min-w-[160px]'}>
            <option value="all">Semua Status</option>
            <option value="pending">Belum Dibayar</option>
            <option value="partial">Dibayar Sebagian</option>
            <option value="paid">Lunas</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <EmptyState loading message="" />
        ) : invoices.length === 0 ? (
          <EmptyState message="Belum ada invoice" />
        ) : (
          invoices.map((inv) => (
            <div
              key={inv.id}
              className="border-2 border-border p-4 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-heading font-medium font-mono text-sm">{inv.invoice_number}</span>
                  <span className={`inline-flex items-center text-xs font-body px-2 py-0.5 rounded border ${statusClasses[inv.status]}`}>
                    {statusLabels[inv.status]}
                  </span>
                </div>
                <p className="text-sm font-body">
                  <span className="font-medium">{inv.patient?.name}</span>
                  <span className="text-muted-foreground"> ({inv.patient?.mr_number})</span>
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground font-body mt-1">
                  <span>{formatDateId(inv.created_at)}</span>
                  <span>Total: <span className="font-medium text-foreground">{formatRupiah(inv.total)}</span></span>
                  <span>Dibayar: {formatRupiah(inv.paid_amount)}</span>
                  <span>Sisa: {formatRupiah(Math.max(0, Number(inv.total) - Number(inv.paid_amount)))}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <ActionButton
                  icon={<Eye className="w-4 h-4" />}
                  label="Detail"
                  onClick={() => navigate(`/billing/${inv.id}`)}
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
    </div>
  )
}
