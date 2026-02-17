import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/retroui/Button'

interface PaginationMeta {
  current_page: number
  last_page: number
  total: number
}

interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.last_page <= 1) return null

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-muted-foreground font-body">
        Hal {meta.current_page} dari {meta.last_page} ({meta.total} data)
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, meta.current_page - 1))}
          disabled={meta.current_page <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(meta.last_page, meta.current_page + 1))}
          disabled={meta.current_page >= meta.last_page}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
