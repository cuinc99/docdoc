import { useCallback } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Badge } from '@/components/retroui/Badge'
import { Input } from '@/components/retroui/Input'
import { Textarea } from '@/components/retroui/Textarea'
import { FormField } from '@/components/shared/FormField'

export interface DrugFormItem {
  drug_name: string
  dosage: string
  frequency: string
  duration: string
  quantity: string
  instructions: string
}

interface PrescriptionItemsEditorProps {
  items: DrugFormItem[]
  notes: string
  onItemsChange: (items: DrugFormItem[]) => void
  onNotesChange: (notes: string) => void
  disabled?: boolean
}

export function PrescriptionItemsEditor({
  items,
  notes,
  onItemsChange,
  onNotesChange,
  disabled,
}: PrescriptionItemsEditorProps) {
  const handleAddDrug = useCallback(() => {
    onItemsChange([...items, { drug_name: '', dosage: '', frequency: '', duration: '', quantity: '', instructions: '' }])
  }, [items, onItemsChange])

  const handleRemoveDrug = useCallback(
    (index: number) => {
      onItemsChange(items.filter((_, i) => i !== index))
    },
    [items, onItemsChange]
  )

  const handleDrugChange = useCallback(
    (index: number, field: keyof DrugFormItem, value: string) => {
      onItemsChange(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
    },
    [items, onItemsChange]
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Text as="h2" className="text-lg">Resep Obat</Text>
        {disabled ? (
          <Badge size="sm" variant="default">Sudah Ditebus</Badge>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={handleAddDrug}>
            <Plus className="w-4 h-4 mr-1" /> Tambah Obat
          </Button>
        )}
      </div>

      {disabled ? (
        <p className="text-sm text-muted-foreground font-body">
          Resep sudah ditebus dan tidak dapat diedit.
        </p>
      ) : items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="border-2 border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-body font-medium">Obat {index + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDrug(index)}
                  className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-body text-destructive border-2 border-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <FormField label="Nama Obat" required>
                  <Input
                    value={item.drug_name}
                    onChange={(e) => handleDrugChange(index, 'drug_name', e.target.value)}
                    placeholder="Nama obat"
                  />
                </FormField>
                <FormField label="Dosis" required>
                  <Input
                    value={item.dosage}
                    onChange={(e) => handleDrugChange(index, 'dosage', e.target.value)}
                    placeholder="cth: 500mg"
                  />
                </FormField>
                <FormField label="Frekuensi" required>
                  <Input
                    value={item.frequency}
                    onChange={(e) => handleDrugChange(index, 'frequency', e.target.value)}
                    placeholder="cth: 3x sehari"
                  />
                </FormField>
                <FormField label="Durasi">
                  <Input
                    value={item.duration}
                    onChange={(e) => handleDrugChange(index, 'duration', e.target.value)}
                    placeholder="cth: 5 hari"
                  />
                </FormField>
                <FormField label="Jumlah" required>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => handleDrugChange(index, 'quantity', e.target.value)}
                    placeholder="1"
                  />
                </FormField>
                <FormField label="Instruksi">
                  <Input
                    value={item.instructions}
                    onChange={(e) => handleDrugChange(index, 'instructions', e.target.value)}
                    placeholder="cth: Sesudah makan"
                  />
                </FormField>
              </div>
            </div>
          ))}

          <FormField label="Catatan Resep">
            <Textarea
              placeholder="Catatan tambahan untuk resep..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="min-h-[60px]"
            />
          </FormField>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground font-body">
          Belum ada item obat. Klik &quot;Tambah Obat&quot; untuk menambahkan resep.
        </p>
      )}
    </div>
  )
}
