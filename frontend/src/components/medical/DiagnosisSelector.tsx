import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Star, Search, Trash2 } from 'lucide-react'
import type { Diagnosis } from '@/api/medicalRecords'
import { searchIcd10 } from '@/api/icd10'
import { Input } from '@/components/retroui/Input'
import { Badge } from '@/components/retroui/Badge'

interface DiagnosisSelectorProps {
  diagnoses: Diagnosis[]
  onAdd: (diagnosis: Diagnosis) => void
  onRemove: (code: string) => void
  onSetPrimary: (code: string) => void
}

export function DiagnosisSelector({ diagnoses, onAdd, onRemove, onSetPrimary }: DiagnosisSelectorProps) {
  const [icdSearch, setIcdSearch] = useState('')
  const [showIcdDropdown, setShowIcdDropdown] = useState(false)

  const { data: icdData } = useQuery({
    queryKey: ['icd10', icdSearch],
    queryFn: () => searchIcd10(icdSearch),
    enabled: icdSearch.length >= 2,
  })

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIcdSearch(e.target.value)
    setShowIcdDropdown(e.target.value.length >= 2)
  }, [])

  const handleBlur = useCallback(() => {
    setTimeout(() => setShowIcdDropdown(false), 200)
  }, [])

  const handleSelect = useCallback(
    (item: { code: string; description: string }) => {
      if (diagnoses.some((d) => d.code === item.code)) return
      onAdd({ code: item.code, description: item.description, is_primary: diagnoses.length === 0 })
      setIcdSearch('')
      setShowIcdDropdown(false)
    },
    [diagnoses, onAdd]
  )

  return (
    <div>
      <div className="relative mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari kode atau nama diagnosis ICD-10..."
            value={icdSearch}
            onChange={handleSearchChange}
            onFocus={() => icdSearch.length >= 2 && setShowIcdDropdown(true)}
            onBlur={handleBlur}
            className="pl-10"
          />
        </div>
        {showIcdDropdown && icdData?.data && icdData.data.length > 0 && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 border-2 border-border bg-background shadow-lg max-h-60 overflow-y-auto">
            {icdData.data.map((item) => (
              <button
                key={item.code}
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-accent transition-colors font-body text-sm cursor-pointer flex items-center gap-3"
                onMouseDown={() => handleSelect(item)}
              >
                <span className="font-mono font-medium shrink-0">{item.code}</span>
                <span className="text-muted-foreground">{item.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {diagnoses.length > 0 ? (
        <div className="space-y-2">
          {diagnoses.map((d) => (
            <div key={d.code} className="flex items-center gap-2 border-2 border-border p-3">
              <button
                type="button"
                onClick={() => onSetPrimary(d.code)}
                className={`p-1 cursor-pointer ${d.is_primary ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-400'}`}
                title={d.is_primary ? 'Diagnosis primer' : 'Jadikan diagnosis primer'}
              >
                <Star className="w-4 h-4" fill={d.is_primary ? 'currentColor' : 'none'} />
              </button>
              <span className="font-mono font-medium text-sm">{d.code}</span>
              <span className="text-sm font-body flex-1">{d.description}</span>
              {d.is_primary && <Badge size="sm" variant="default">Primer</Badge>}
              <button
                type="button"
                onClick={() => onRemove(d.code)}
                className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-body text-destructive border-2 border-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                aria-label={`Hapus diagnosis ${d.code}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground font-body">
          Belum ada diagnosis. Cari dan tambahkan minimal 1 diagnosis.
        </p>
      )}
    </div>
  )
}
