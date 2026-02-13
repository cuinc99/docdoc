import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:pl-64">
        <div className="p-4 lg:p-6 pb-20 lg:pb-6">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
