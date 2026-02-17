import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getInvoice, updateInvoice } from '@/api/invoices'
import { getServices } from '@/api/services'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { useSnackbar } from '@/components/retroui/Snackbar'
import { PageHeader, EmptyState } from '@/components/shared'
import { InvoiceItemsEditor } from '@/components/billing/InvoiceItemsEditor'
import type { InvoiceItemRow } from '@/components/billing/InvoiceItemsEditor'
import { InvoiceSummary } from '@/components/billing/InvoiceSummary'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/types'

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
    return <EmptyState loading message="" />
  }

  if (!invoice) {
    return <EmptyState message="Invoice tidak ditemukan" />
  }

  if (invoice.status !== 'pending') {
    return <EmptyState message="Invoice tidak dapat diedit karena sudah diproses" />
  }

  return (
    <div>
      <PageHeader
        title="Edit Invoice"
        subtitle={`${invoice.invoice_number} - ${invoice.patient?.name} (${invoice.patient?.mr_number})`}
        onBack={handleBack}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border-2 border-border p-4 shadow-md">
          <InvoiceItemsEditor items={items} services={services} onItemsChange={setItems} />
        </div>

        <div className="border-2 border-border p-4 shadow-md">
          <Text as="h2" className="text-lg mb-4">Ringkasan</Text>
          <InvoiceSummary
            subtotal={subtotal}
            discount={discount}
            taxPercent={taxPercent}
            onDiscountChange={setDiscount}
            onTaxPercentChange={setTaxPercent}
          />
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
