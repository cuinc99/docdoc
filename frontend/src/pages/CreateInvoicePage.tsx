import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { getPatients } from '@/api/patients'
import { getServices } from '@/api/services'
import { createInvoice } from '@/api/invoices'
import { Button } from '@/components/retroui/Button'
import { Input } from '@/components/retroui/Input'
import { Text } from '@/components/retroui/Text'
import { useSnackbar } from '@/components/retroui/Snackbar'
import { PageHeader } from '@/components/shared'
import { InvoiceItemsEditor } from '@/components/billing/InvoiceItemsEditor'
import type { InvoiceItemRow } from '@/components/billing/InvoiceItemsEditor'
import { InvoiceSummary } from '@/components/billing/InvoiceSummary'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/types'

export default function CreateInvoicePage() {
  const navigate = useNavigate()
  const { showSnackbar } = useSnackbar()

  const [patientId, setPatientId] = useState<number | null>(null)
  const [patientSearch, setPatientSearch] = useState('')
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [items, setItems] = useState<InvoiceItemRow[]>([{ description: '', quantity: '1', unit_price: '' }])
  const [discount, setDiscount] = useState('')
  const [taxPercent, setTaxPercent] = useState('')

  const { data: patientsData } = useQuery({
    queryKey: ['patients', patientSearch],
    queryFn: () => getPatients({ search: patientSearch, per_page: 10 }),
    enabled: patientSearch.length >= 2,
  })

  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: getServices,
  })

  const services = servicesData?.data ?? []

  const mutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      navigate(`/billing/${res.data.id}`)
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal membuat invoice', 'error')
    },
  })

  const subtotal = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0) * (parseFloat(item.unit_price) || 0), 0)
  const discountVal = parseFloat(discount) || 0
  const taxPercentVal = parseFloat(taxPercent) || 0

  const handlePatientSelect = useCallback((id: number, name: string) => {
    setPatientId(id)
    setPatientSearch(name)
    setShowPatientDropdown(false)
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!patientId) {
        showSnackbar('Pilih pasien terlebih dahulu', 'error')
        return
      }
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
        patient_id: patientId,
        items: validItems,
        discount: discountVal,
        tax_percent: taxPercentVal,
      })
    },
    [patientId, items, discountVal, taxPercentVal, mutation, showSnackbar]
  )

  return (
    <div>
      <PageHeader title="Buat Invoice" onBack={() => navigate('/billing')} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border-2 border-border p-4 shadow-md">
          <Text as="h2" className="text-lg mb-4">Pasien</Text>
          <div className="relative max-w-md">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari pasien (nama / no. RM)..."
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value)
                  setPatientId(null)
                  setShowPatientDropdown(e.target.value.length >= 2)
                }}
                onFocus={() => patientSearch.length >= 2 && setShowPatientDropdown(true)}
                onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)}
              />
            </div>
            {showPatientDropdown && patientsData?.data && patientsData.data.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 border-2 border-border bg-background shadow-lg max-h-48 overflow-y-auto">
                {patientsData.data.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-accent transition-colors font-body text-sm cursor-pointer"
                    onMouseDown={() => handlePatientSelect(p.id, `${p.name} (${p.mr_number})`)}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground ml-2">{p.mr_number}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

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
          <Button type="button" variant="outline" onClick={() => navigate('/billing')}>
            Batal
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Menyimpan...' : 'Simpan Invoice'}
          </Button>
        </div>
      </form>
    </div>
  )
}
