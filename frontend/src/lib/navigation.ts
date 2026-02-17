import type { Role } from '@/types'
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Stethoscope,
  CalendarDays,
  ClipboardList,
  Receipt,
  Building2,
  Pill,
  Briefcase,
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
  { label: 'Jadwal', href: '/schedules', icon: CalendarDays, group: 'Data' },
  { label: 'Resep', href: '/prescriptions', icon: Pill, group: 'Transaksi', roles: ['admin', 'doctor'] },
  { label: 'Billing', href: '/billing', icon: Receipt, group: 'Transaksi', roles: ['admin', 'receptionist'] },
  { label: 'Klinik', href: '/settings/clinic', icon: Building2, group: 'Pengaturan', roles: ['admin'] },
  { label: 'Staff', href: '/settings/staff', icon: Users, group: 'Pengaturan', roles: ['admin'] },
  { label: 'Layanan', href: '/settings/services', icon: Briefcase, group: 'Pengaturan', roles: ['admin'] },
  { label: 'Profil', href: '/profile', icon: UserCircle, group: 'Pengaturan' },
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
  { label: 'Klinik', href: '/settings/clinic', icon: Building2, roles: ['admin'] },
  { label: 'Staff', href: '/settings/staff', icon: Users, roles: ['admin'] },
  { label: 'Layanan', href: '/settings/services', icon: Briefcase, roles: ['admin'] },
  { label: 'Profil', href: '/profile', icon: UserCircle },
]

export function filterByRole(items: NavItem[], role: Role): NavItem[] {
  return items.filter((item) => !item.roles || item.roles.includes(role))
}
