import { useState, useMemo, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { bottomNavItems, filterByRole } from '@/lib/navigation'
import { MoreDrawer } from './MoreDrawer'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { user } = useAuth()

  const items = useMemo(
    () => (user ? filterByRole(bottomNavItems, user.role) : []),
    [user]
  )

  const handleOpenDrawer = useCallback(() => setIsDrawerOpen(true), [])
  const handleCloseDrawer = useCallback(() => setIsDrawerOpen(false), [])

  if (!user) return null

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t-2 border-border">
        <div className="flex items-center justify-around h-16 px-2">
          {items.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded transition-colors',
                  isActive
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-body">{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={handleOpenDrawer}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded transition-colors cursor-pointer',
              isDrawerOpen ? 'text-primary font-medium' : 'text-muted-foreground'
            )}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-body">Lainnya</span>
          </button>
        </div>
      </nav>

      <MoreDrawer open={isDrawerOpen} onClose={handleCloseDrawer} />
    </>
  )
}
