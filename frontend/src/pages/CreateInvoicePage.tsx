import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2, Search } from 'lucide-react'
import { getPatients } from '@/api/patients'
import { getServices } from '@/api/services'
import { createInvoice } from '@/api/invoices'
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
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate('/billing')} aria-label="Kembali">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Text as="h1" className="text-2xl lg:text-3xl">Buat Invoice</Text>
      </div>

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
                    <label className="text-sm font-body font-medium">Pilih Layanan</label>
                    <select
                      className={selectClass + ' w-full'}
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
                    <label className="text-sm font-body font-medium">Deskripsi *</label>
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
