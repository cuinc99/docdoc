import { Input } from '@/components/retroui/Input'
import { FormField } from '@/components/shared/FormField'
import { formatRupiah } from '@/lib/utils'

interface InvoiceSummaryProps {
  subtotal: number
  discount: string
  taxPercent: string
  onDiscountChange: (value: string) => void
  onTaxPercentChange: (value: string) => void
}

export function InvoiceSummary({
  subtotal,
  discount,
  taxPercent,
  onDiscountChange,
  onTaxPercentChange,
}: InvoiceSummaryProps) {
  const discountVal = parseFloat(discount) || 0
  const taxPercentVal = parseFloat(taxPercent) || 0
  const afterDiscount = subtotal - discountVal
  const taxVal = afterDiscount > 0 ? Math.round((afterDiscount * taxPercentVal) / 100) : 0
  const total = Math.max(0, afterDiscount + taxVal)

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 max-w-sm">
        <FormField label="Diskon (Rp)">
          <Input
            type="number"
            min={0}
            value={discount}
            onChange={(e) => onDiscountChange(e.target.value)}
            placeholder="0"
          />
        </FormField>
        <FormField label="Pajak (%)">
          <Input
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={taxPercent}
            onChange={(e) => onTaxPercentChange(e.target.value)}
            placeholder="0"
          />
        </FormField>
      </div>
      <div className="mt-4 space-y-1 text-sm font-body max-w-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatRupiah(subtotal)}</span>
        </div>
        {discountVal > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Diskon</span>
            <span>- {formatRupiah(discountVal)}</span>
          </div>
        )}
        {taxPercentVal > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pajak ({taxPercentVal}%)</span>
            <span>{formatRupiah(taxVal)}</span>
          </div>
        )}
        <div className="flex justify-between font-medium text-base border-t border-border pt-1">
          <span>Total</span>
          <span>{formatRupiah(total)}</span>
        </div>
      </div>
    </div>
  )
}
