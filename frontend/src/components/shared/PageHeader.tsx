import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'

interface PageHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  children?: ReactNode
}

export function PageHeader({ title, subtitle, onBack, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack} aria-label="Kembali">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <div>
          <Text as="h1" className="text-2xl lg:text-3xl">{title}</Text>
          {subtitle && <p className="text-sm text-muted-foreground font-body">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  )
}
