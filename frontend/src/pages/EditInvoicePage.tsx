import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { getInvoice, updateInvoice } from '@/api/invoices'
import { getServices } from '@/api/services'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Input } from '@/components/retroui/Input'
import { useSnackbar } from '@/components/retroui/Snackbar'
import { selectClass } from '@/lib/utils'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/types'

interface InvoiceItemRow {
  description: string
  quantity: string
  unit_price: string
}

export default function EditInvoicePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const invoiceId = Number(id)

  const [items, setItems] = useState<InvoiceItemRow[]>([])
  const [discount, setDiscount] = useState('')
  const [taxPercent, setTaxPercent] = useState('')
  const [initialized, setInitialized] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getInvoice(invoiceId),
    enabled: !!id,
  })

  const invoice = data?.data ?? null

  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: getServices,
  })

  const services = servicesData?.data ?? []

  useEffect(() => {
    if (invoice && !initialized) {
      setItems(
        invoice.items.map((item) => ({
          description: item.description,
          quantity: String(item.quantity),
          unit_price: String(Number(item.unit_price)),
        }))
      )
      setDiscount(Number(invoice.discount) > 0 ? String(Number(invoice.discount)) : '')
      const subtotal = Number(invoice.subtotal)
      const discountNum = Number(invoice.discount)
      const taxNum = Number(invoice.tax)
      const afterDiscount = subtotal - discountNum
      if (afterDiscount > 0 && taxNum > 0) {
        setTaxPercent(String(Math.round((taxNum / afterDiscount) * 10000) / 100))
      }
      setInitialized(true)
    }
  }, [invoice, initialized])

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateInvoice>[1]) => updateInvoice(invoiceId, payload),
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      navigate(`/billing/${invoiceId}`)
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal memperbarui invoice', 'error')
    },
  })

  const subtotal = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0) * (parseFloat(item.unit_price) || 0), 0)
  const discountVal = parseFloat(discount) || 0
  const taxPercentVal = parseFloat(taxPercent) || 0
  const afterDiscount = subtotal - discountVal
  const taxVal = afterDiscount > 0 ? Math.round(afterDiscount * taxPercentVal / 100) : 0
  const total = Math.max(0, afterDiscount + taxVal)

  const handleAddItem = useCallback(() => {
    setItems((prev) => [...prev, { description: '', quantity: '1', unit_price: '' }])
  }, [])

  const handleRemoveItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleItemChange = useCallback((index: number, field: keyof InvoiceItemRow, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }, [])

  const handleServiceSelect = useCallback(
    (index: number, serviceId: string) => {
      if (!serviceId) return
      const service = services.find((s) => s.id === Number(serviceId))
      if (service) {
        setItems((prev) =>
          prev.map((item, i) =>
            i === index ? { ...item, description: service.name, unit_price: String(Number(service.price)) } : item
          )
        )
      }
    },
    [services]
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!invoice) return
      const validItems = items
        .filter((item) => item.description && (parseFloat(item.unit_price) || 0) > 0)
        .map((item) => ({
          description: item.description,
          quantity: parseInt(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price) || 0,
        }))
      if (validItems.length === 0) {
        showSnackbar('Minimal 1 item harus diisi', 'error')
        return
      }
      mutation.mutate({
        patient_id: invoice.patient_id,
        items: validItems,
        discount: discountVal,
        tax_percent: taxPercentVal,
      })
    },
    [invoice, items, discountVal, taxPercentVal, mutation, showSnackbar]
  )

  const handleBack = useCallback(() => navigate(`/billing/${invoiceId}`), [navigate, invoiceId])

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
        <Button variant="outline" onClick={() => navigate('/billing')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>
    )
  }

  if (invoice.status !== 'pending') {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-muted-foreground font-body">Invoice tidak dapat diedit karena sudah diproses</p>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={handleBack} aria-label="Kembali">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <Text as="h1" className="text-2xl lg:text-3xl">Edit Invoice</Text>
          <p className="text-sm text-muted-foreground font-body">
            {invoice.invoice_number} - {invoice.patient?.name} ({invoice.patient?.mr_number})
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border-2 border-border p-4 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <Text as="h2" className="text-lg">Item</Text>
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
              <Plus className="w-4 h-4 mr-1" /> Tambah
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body font-medium">Item {index + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-body text-destructive border-2 border-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  )}
                </div>

                {services.length > 0 && (
                  <div>
                    <label className="text-xs font-body text-muted-foreground">Pilih Layanan</label>
                    <select
                      className={selectClass}
                      onChange={(e) => handleServiceSelect(index, e.target.value)}
                      value=""
                    >
                      <option value="">-- Pilih layanan --</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} - Rp {Number(s.price).toLocaleString('id-ID')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <label className="text-xs font-body text-muted-foreground">Deskripsi *</label>
                    <Input
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Deskripsi"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-body text-muted-foreground">Jumlah *</label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-body text-muted-foreground">Harga Satuan *</label>
                    <Input
                      type="number"
                      min={0}
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-body text-right">
                  Total: Rp {((parseInt(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-2 border-border p-4 shadow-md">
          <Text as="h2" className="text-lg mb-4">Ringkasan</Text>
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <div>
              <label className="text-xs font-body text-muted-foreground">Diskon (Rp)</label>
              <Input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs font-body text-muted-foreground">Pajak (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="mt-4 space-y-1 text-sm font-body max-w-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            {discountVal > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diskon</span>
                <span>- Rp {discountVal.toLocaleString('id-ID')}</span>
              </div>
            )}
            {taxPercentVal > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pajak ({taxPercentVal}%)</span>
                <span>Rp {taxVal.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between font-medium text-base border-t border-border pt-1">
              <span>Total</span>
              <span>Rp {total.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleBack}>
            Batal
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </div>
  )
}
