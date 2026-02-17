import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Download, XCircle, Plus, Pencil } from 'lucide-react'
import { getInvoice, addPayment, cancelInvoice, downloadInvoicePdf } from '@/api/invoices'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Input } from '@/components/retroui/Input'
import { useSnackbar } from '@/components/retroui/Snackbar'
import { formatDateTimeId, selectClass } from '@/lib/utils'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/types'

const statusLabels: Record<string, string> = {
  pending: 'Belum Dibayar',
  partial: 'Dibayar Sebagian',
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

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const invoiceId = Number(id)

  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentReference, setPaymentReference] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getInvoice(invoiceId),
    enabled: !!id,
  })

  const invoice = data?.data ?? null

  const paymentMutation = useMutation({
    mutationFn: (payload: { amount: number; method: string; reference?: string }) =>
      addPayment(invoiceId, payload),
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setShowPaymentForm(false)
      setPaymentAmount('')
      setPaymentReference('')
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal menambah pembayaran', 'error')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelInvoice(invoiceId),
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setShowCancelConfirm(false)
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal membatalkan invoice', 'error')
    },
  })

  const handlePaymentSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const amount = parseFloat(paymentAmount)
      if (!amount || amount <= 0) {
        showSnackbar('Jumlah pembayaran harus lebih dari 0', 'error')
        return
      }
      paymentMutation.mutate({
        amount,
        method: paymentMethod,
        ...(paymentMethod === 'transfer' && paymentReference ? { reference: paymentReference } : {}),
      })
    },
    [paymentAmount, paymentMethod, paymentReference, paymentMutation, showSnackbar]
  )

  const handleDownloadPdf = useCallback(async () => {
    try {
      await downloadInvoicePdf(invoiceId)
    } catch {
      showSnackbar('Gagal mengunduh PDF', 'error')
    }
  }, [invoiceId, showSnackbar])

  const handleBack = useCallback(() => navigate('/billing'), [navigate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground font-body">Memuat data...</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-muted-foreground font-body">Invoice tidak ditemukan</p>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>
    )
  }

  const remaining = Math.max(0, Number(invoice.total) - Number(invoice.paid_amount))
  const canPay = invoice.status === 'pending' || invoice.status === 'partial'
  const canCancel = invoice.status === 'pending'

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={handleBack} aria-label="Kembali">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Text as="h1" className="text-2xl lg:text-3xl">{invoice.invoice_number}</Text>
            <span className={`inline-flex items-center text-xs font-body px-2 py-0.5 rounded border ${statusClasses[invoice.status]}`}>
              {statusLabels[invoice.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-body">
            {invoice.patient?.name} ({invoice.patient?.mr_number})
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="border-2 border-border p-4 shadow-md">
          <Text as="h2" className="text-lg mb-3">Detail Item</Text>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-2 px-2">No</th>
                  <th className="text-left py-2 px-2">Deskripsi</th>
                  <th className="text-center py-2 px-2">Qty</th>
                  <th className="text-right py-2 px-2">Harga</th>
                  <th className="text-right py-2 px-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-2 px-2">{i + 1}</td>
                    <td className="py-2 px-2">{item.description}</td>
                    <td className="py-2 px-2 text-center">{item.quantity}</td>
                    <td className="py-2 px-2 text-right">{formatRupiah(item.unit_price)}</td>
                    <td className="py-2 px-2 text-right">{formatRupiah(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 space-y-1 text-sm font-body max-w-xs ml-auto">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatRupiah(invoice.subtotal)}</span>
            </div>
            {Number(invoice.discount) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diskon</span>
                <span>- {formatRupiah(invoice.discount)}</span>
              </div>
            )}
            {Number(invoice.tax) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pajak</span>
                <span>{formatRupiah(invoice.tax)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium border-t border-border pt-1">
              <span>Total</span>
              <span>{formatRupiah(invoice.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dibayar</span>
              <span>{formatRupiah(invoice.paid_amount)}</span>
            </div>
            <div className="flex justify-between font-medium text-base">
              <span>Sisa</span>
              <span>{formatRupiah(remaining)}</span>
            </div>
          </div>
        </div>

        {invoice.payments && invoice.payments.length > 0 && (
          <div className="border-2 border-border p-4 shadow-md">
            <Text as="h2" className="text-lg mb-3">Riwayat Pembayaran</Text>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-2 px-2">Tanggal</th>
                    <th className="text-right py-2 px-2">Jumlah</th>
                    <th className="text-left py-2 px-2">Metode</th>
                    <th className="text-left py-2 px-2">Referensi</th>
                    <th className="text-left py-2 px-2">Diterima</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((p) => (
                    <tr key={p.id} className="border-b border-border">
                      <td className="py-2 px-2">{formatDateTimeId(p.created_at)}</td>
                      <td className="py-2 px-2 text-right">{formatRupiah(p.amount)}</td>
                      <td className="py-2 px-2">{p.method === 'cash' ? 'Tunai' : 'Transfer'}</td>
                      <td className="py-2 px-2">{p.reference || '-'}</td>
                      <td className="py-2 px-2">{p.received_by_user?.name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {canCancel && (
            <Button variant="outline" onClick={() => navigate(`/billing/${invoiceId}/edit`)}>
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </Button>
          )}
          {canPay && (
            <Button onClick={() => setShowPaymentForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> Tambah Pembayaran
            </Button>
          )}
          <Button variant="outline" onClick={handleDownloadPdf}>
            <Download className="w-4 h-4 mr-1" /> Download PDF
          </Button>
          {canCancel && (
            <Button variant="outline" onClick={() => setShowCancelConfirm(true)}>
              <XCircle className="w-4 h-4 mr-1" /> Batalkan
            </Button>
          )}
        </div>
      </div>

      {showPaymentForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowPaymentForm(false)}>
          <div
            className="bg-background border-2 border-border shadow-lg p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Text as="h2" className="text-lg mb-4">Tambah Pembayaran</Text>
            <form onSubmit={handlePaymentSubmit} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-body font-medium">Jumlah (max: {formatRupiah(remaining)}) *</label>
                  <button
                    type="button"
                    className="text-xs font-body text-primary hover:underline cursor-pointer"
                    onClick={() => setPaymentAmount(String(remaining))}
                  >
                    Bayar Semua
                  </button>
                </div>
                <Input
                  type="number"
                  min={1}
                  max={remaining}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Jumlah pembayaran"
                />
              </div>
              <div>
                <label className="text-sm font-body font-medium">Metode *</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={selectClass}>
                  <option value="cash">Tunai</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
              {paymentMethod === 'transfer' && (
                <div>
                  <label className="text-sm font-body font-medium">Referensi</label>
                  <Input
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="No. referensi transfer"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowPaymentForm(false)}>
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={paymentMutation.isPending}>
                  {paymentMutation.isPending ? 'Memproses...' : 'Bayar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCancelConfirm(false)}>
          <div
            className="bg-background border-2 border-border shadow-lg p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-heading font-medium mb-2">Batalkan Invoice?</p>
            <p className="text-sm text-muted-foreground font-body mb-4">
              Invoice yang dibatalkan tidak dapat dikembalikan. Lanjutkan?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCancelConfirm(false)}>
                Tidak
              </Button>
              <Button
                size="sm"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? 'Memproses...' : 'Ya, Batalkan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
