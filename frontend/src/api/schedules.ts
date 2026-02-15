import api from '@/api/axios'
import type { ApiResponse } from '@/types'

export interface ScheduleDoctor {
  id: number
  name: string
  specialization: string | null
}

export interface Schedule {
  id: number
  doctor_id: number
  doctor?: ScheduleDoctor
  date: string
  start_time: string
  end_time: string
  is_available: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ScheduleListParams {
  doctor_id?: number
  date_from?: string
  date_to?: string
}

export interface SchedulePayload {
  doctor_id: number
  date: string
  start_time: string
  end_time: string
  is_available?: boolean
  notes?: string | null
}

export async function getSchedules(params: ScheduleListParams = {}) {
  const { data } = await api.get<ApiResponse<Schedule[]>>('/api/schedules', { params })
  return data
}

export async function getSchedule(id: number) {
  const { data } = await api.get<ApiResponse<Schedule>>(`/api/schedules/${id}`)
  return data
}

export async function createSchedule(payload: SchedulePayload) {
  const { data } = await api.post<ApiResponse<Schedule>>('/api/schedules', payload)
  return data
}

export async function updateSchedule(id: number, payload: SchedulePayload) {
  const { data } = await api.put<ApiResponse<Schedule>>(`/api/schedules/${id}`, payload)
  return data
}

export async function toggleSchedule(id: number) {
  const { data } = await api.patch<ApiResponse<Schedule>>(`/api/schedules/${id}/toggle`)
  return data
}

export async function deleteSchedule(id: number) {
  const { data } = await api.delete<ApiResponse<null>>(`/api/schedules/${id}`)
  return data
}
