import type { ReactNode } from 'react'
import { Text } from '@/components/retroui/Text'

interface PageHeaderProps {
  title: string
  children?: ReactNode
}

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <Text as="h1" className="text-2xl lg:text-3xl">{title}</Text>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  )
}
