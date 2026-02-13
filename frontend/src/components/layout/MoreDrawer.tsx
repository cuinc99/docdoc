import { useEffect, useMemo, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import { X, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { moreDrawerItems, filterByRole } from '@/lib/navigation'
import { cn } from '@/lib/utils'

interface MoreDrawerProps {
  open: boolean
  onClose: () => void
}

export function MoreDrawer({ open, onClose }: MoreDrawerProps) {
  const { user, logout } = useAuth()

  const items = useMemo(
    () => (user ? filterByRole(moreDrawerItems, user.role) : []),
    [user]
  )

  const handleLogout = useCallback(() => {
    onClose()
    logout()
  }, [onClose, logout])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!user) return null

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-black/40 z-50 transition-opacity lg:hidden',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal={open}
        aria-label="Menu tambahan"
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-background border-t-2 border-border rounded-t-2xl transition-transform duration-300 ease-out lg:hidden',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b-2 border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-heading">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium font-body">{user.name}</p>
              <p className="text-xs text-muted-foreground font-body capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup menu"
            className="p-2 hover:bg-accent rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-3 rounded text-sm font-body transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-foreground hover:bg-accent'
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t-2 border-border pb-8">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 w-full rounded text-sm font-body text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </>
  )
}
