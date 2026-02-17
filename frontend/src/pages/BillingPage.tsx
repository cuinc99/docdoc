import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, Plus, Filter } from 'lucide-react'
import { getInvoices } from '@/api/invoices'
import { Button } from '@/components/retroui/Button'
import { Select } from '@/components/retroui/Select'
import { PageHeader, EmptyState, ActionButton, SearchBar, Pagination } from '@/components/shared'
import { formatDateId, formatRupiah } from '@/lib/utils'

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

  return (
    <div>
      <PageHeader title="Billing">
        <Button onClick={() => navigate('/billing/create')}>
          <Plus className="w-4 h-4 mr-1" /> Buat Invoice
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          onSearch={handleSearch}
          placeholder="Cari nama pasien atau nomor invoice..."
        />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onChange={handleFilterChange} className="min-w-[160px]">
            <option value="all">Semua Status</option>
            <option value="pending">Belum Dibayar</option>
            <option value="partial">Dibayar Sebagian</option>
            <option value="paid">Lunas</option>
            <option value="cancelled">Dibatalkan</option>
          </Select>
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

      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  )
}
