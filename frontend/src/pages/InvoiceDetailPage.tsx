import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, XCircle, Plus, Pencil } from 'lucide-react'
import { getInvoice, addPayment, cancelInvoice, downloadInvoicePdf } from '@/api/invoices'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Input } from '@/components/retroui/Input'
import { Select } from '@/components/retroui/Select'
import { Dialog } from '@/components/retroui/Dialog'
import { useSnackbar } from '@/components/retroui/Snackbar'
import { PageHeader, EmptyState, ConfirmDialog, FormField } from '@/components/shared'
import { formatDateTimeId, formatRupiah } from '@/lib/utils'
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
    return <EmptyState loading message="" />
  }

  if (!invoice) {
    return <EmptyState message="Invoice tidak ditemukan" />
  }

  const remaining = Math.max(0, Number(invoice.total) - Number(invoice.paid_amount))
  const canPay = invoice.status === 'pending' || invoice.status === 'partial'
  const canCancel = invoice.status === 'pending'

  return (
    <div>
      <PageHeader
        title={invoice.invoice_number}
        subtitle={`${invoice.patient?.name} (${invoice.patient?.mr_number})`}
        onBack={handleBack}
      >
        <span className={`inline-flex items-center text-xs font-body px-2 py-0.5 rounded border ${statusClasses[invoice.status]}`}>
          {statusLabels[invoice.status]}
        </span>
      </PageHeader>

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

      <Dialog open={showPaymentForm} onClose={() => setShowPaymentForm(false)} title="Tambah Pembayaran" maxWidth="max-w-sm">
        <form onSubmit={handlePaymentSubmit} className="space-y-3">
          <FormField label={`Jumlah (max: ${formatRupiah(remaining)})`} required>
            <div className="flex items-center justify-between mb-1">
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
          </FormField>
          <FormField label="Metode" required>
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full">
              <option value="cash">Tunai</option>
              <option value="transfer">Transfer</option>
            </Select>
          </FormField>
          {paymentMethod === 'transfer' && (
            <FormField label="Referensi">
              <Input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="No. referensi transfer"
              />
            </FormField>
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
      </Dialog>

      <ConfirmDialog
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Batalkan Invoice?"
        message="Invoice yang dibatalkan tidak dapat dikembalikan. Lanjutkan?"
        confirmLabel="Ya, Batalkan"
        cancelLabel="Tidak"
        variant="destructive"
        isPending={cancelMutation.isPending}
      />
    </div>
  )
}
