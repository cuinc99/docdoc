import { Search } from 'lucide-react'
import { Input } from '@/components/retroui/Input'
import { Button } from '@/components/retroui/Button'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch: (e: React.FormEvent) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, onSearch, placeholder = 'Cari...' }: SearchBarProps) {
  return (
    <form onSubmit={onSearch} className="flex gap-2 flex-1">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Button type="submit" variant="outline" size="sm">Cari</Button>
    </form>
  )
}
