import { useCallback } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Service } from '@/api/services'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Input } from '@/components/retroui/Input'
import { Select } from '@/components/retroui/Select'
import { FormField } from '@/components/shared/FormField'

export interface InvoiceItemRow {
  description: string
  quantity: string
  unit_price: string
}

interface InvoiceItemsEditorProps {
  items: InvoiceItemRow[]
  services: Service[]
  onItemsChange: (items: InvoiceItemRow[]) => void
}

export function InvoiceItemsEditor({ items, services, onItemsChange }: InvoiceItemsEditorProps) {
  const handleAddItem = useCallback(() => {
    onItemsChange([...items, { description: '', quantity: '1', unit_price: '' }])
  }, [items, onItemsChange])

  const handleRemoveItem = useCallback(
    (index: number) => {
      onItemsChange(items.filter((_, i) => i !== index))
    },
    [items, onItemsChange]
  )

  const handleItemChange = useCallback(
    (index: number, field: keyof InvoiceItemRow, value: string) => {
      onItemsChange(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
    },
    [items, onItemsChange]
  )

  const handleServiceSelect = useCallback(
    (index: number, serviceId: string) => {
      if (!serviceId) return
      const service = services.find((s) => s.id === Number(serviceId))
      if (service) {
        onItemsChange(
          items.map((item, i) =>
            i === index ? { ...item, description: service.name, unit_price: String(Number(service.price)) } : item
          )
        )
      }
    },
    [services, items, onItemsChange]
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Text as="h2" className="text-lg">Item</Text>
        <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
          <Plus className="w-4 h-4 mr-1" /> Tambah
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="border-2 border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-body font-medium">Item {index + 1}</span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-body text-destructive border-2 border-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus
                </button>
              )}
            </div>

            {services.length > 0 && (
              <FormField label="Pilih Layanan">
                <Select
                  className="w-full"
                  onChange={(e) => handleServiceSelect(index, e.target.value)}
                  value=""
                >
                  <option value="">-- Pilih layanan --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - Rp {Number(s.price).toLocaleString('id-ID')}
                    </option>
                  ))}
                </Select>
              </FormField>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <FormField label="Deskripsi" required className="sm:col-span-1">
                <Input
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  placeholder="Deskripsi"
                />
              </FormField>
              <FormField label="Jumlah" required>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                />
              </FormField>
              <FormField label="Harga Satuan" required>
                <Input
                  type="number"
                  min={0}
                  value={item.unit_price}
                  onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                  placeholder="0"
                />
              </FormField>
            </div>
            <p className="text-xs text-muted-foreground font-body text-right">
              Total: Rp {((parseInt(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toLocaleString('id-ID')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
