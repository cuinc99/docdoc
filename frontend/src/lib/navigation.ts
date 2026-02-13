import type { Role } from '@/types'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Stethoscope,
  CalendarDays,
  ClipboardList,
  Receipt,
  Settings,
  Pill,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles?: Role[]
  group?: string
}

export const sidebarNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'Dashboard' },
  { label: 'Antrian', href: '/queue', icon: ClipboardList, group: 'Pelayanan' },
  { label: 'Rekam Medis', href: '/medical-records', icon: Stethoscope, group: 'Pelayanan', roles: ['admin', 'doctor'] },
  { label: 'Pasien', href: '/patients', icon: Users, group: 'Data' },
  { label: 'Dokter', href: '/doctors', icon: UserPlus, group: 'Data', roles: ['admin'] },
  { label: 'Jadwal', href: '/schedules', icon: CalendarDays, group: 'Data' },
  { label: 'Resep', href: '/prescriptions', icon: Pill, group: 'Transaksi', roles: ['admin', 'doctor'] },
  { label: 'Billing', href: '/billing', icon: Receipt, group: 'Transaksi', roles: ['admin', 'receptionist'] },
  { label: 'Pengaturan', href: '/settings', icon: Settings, group: 'Pengaturan', roles: ['admin'] },
]

export const bottomNavItems: NavItem[] = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Antrian', href: '/queue', icon: ClipboardList },
  { label: 'Pasien', href: '/patients', icon: Users },
  { label: 'Medis', href: '/medical-records', icon: Stethoscope },
]

export const moreDrawerItems: NavItem[] = [
  { label: 'Jadwal', href: '/schedules', icon: CalendarDays },
  { label: 'Resep', href: '/prescriptions', icon: Pill, roles: ['admin', 'doctor'] },
  { label: 'Billing', href: '/billing', icon: Receipt, roles: ['admin', 'receptionist'] },
  { label: 'Dokter', href: '/doctors', icon: UserPlus, roles: ['admin'] },
  { label: 'Pengaturan', href: '/settings', icon: Settings, roles: ['admin'] },
]

export function filterByRole(items: NavItem[], role: Role): NavItem[] {
  return items.filter((item) => !item.roles || item.roles.includes(role))
}
