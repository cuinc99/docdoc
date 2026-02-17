import api from '@/api/axios'
import type { ApiResponse } from '@/types'

export interface AdminDashboard {
  total_patients: number
  today_visits: number
  monthly_revenue: number
  active_queues: number
  visit_chart: { date: string; count: number }[]
}

export interface DoctorDashboard {
  my_patients_today: number
  my_active_queues: number
  recent_records: Array<{
    id: number
    created_at: string
    patient?: { id: number; name: string; mr_number: string }
  }>
  undispensed_prescriptions: number
}

export interface ReceptionistDashboard {
  today_queues: number
  pending_invoices: number
  new_patients_today: number
  today_payments: number
}

export type DashboardData = AdminDashboard | DoctorDashboard | ReceptionistDashboard

export async function getDashboard() {
  const { data } = await api.get<ApiResponse<DashboardData>>('/api/dashboard')
  return data
}
