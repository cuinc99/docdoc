import { useMemo, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { sidebarNavItems, filterByRole } from '@/lib/navigation'
import { Text } from '@/components/retroui/Text'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const { user, logout } = useAuth()

  const items = useMemo(
    () => (user ? filterByRole(sidebarNavItems, user.role) : []),
    [user]
  )

  const groups = useMemo(
    () => [...new Set(items.map((item) => item.group))],
    [items]
  )

  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  if (!user) return null

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r-2 border-border bg-sidebar">
      <div className="flex flex-col h-full">
        <div className="p-4 border-b-2 border-border">
          <Text as="h1" className="text-2xl">DocDoc</Text>
          <p className="text-xs text-muted-foreground font-body">Sistem Manajemen Klinik</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {groups.map((group) => (
            <div key={group}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-1 font-body">
                {group}
              </p>
              <ul className="space-y-0.5">
                {items
                  .filter((item) => item.group === group)
                  .map((item) => (
                    <li key={item.href}>
                      <NavLink
                        to={item.href}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-3 py-2 rounded text-sm font-body transition-colors',
                            isActive
                              ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent'
                          )
                        }
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t-2 border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-heading shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate font-body">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate font-body capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded text-sm font-body text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  )
}
