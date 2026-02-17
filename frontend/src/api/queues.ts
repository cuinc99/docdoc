import api from '@/api/axios'
import type { ApiResponse } from '@/types'

export interface QueueDoctor {
  id: number
  name: string
  specialization: string | null
}

export interface QueuePatient {
  id: number
  name: string
  mr_number: string
  gender: 'male' | 'female'
  birth_date: string
  phone: string
}

export type QueueStatus = 'waiting' | 'vitals' | 'in_consultation' | 'completed' | 'cancelled'
export type QueuePriority = 'normal' | 'urgent'

export interface Queue {
  id: number
  doctor_id: number
  patient_id: number
  queue_number: number
  date: string
  status: QueueStatus
  priority: QueuePriority
  called_at: string | null
  started_at: string | null
  completed_at: string | null
  doctor?: QueueDoctor
  patient?: QueuePatient
  created_at: string
  updated_at: string
}

export interface QueueListParams {
  doctor_id?: number
  date?: string
  status?: QueueStatus
}

export interface QueuePayload {
  patient_id: number
  doctor_id: number
  date?: string
  priority?: QueuePriority
}

export async function getQueues(params: QueueListParams = {}) {
  const { data } = await api.get<ApiResponse<Queue[]>>('/api/queues', { params })
  return data
}

export async function getQueue(id: number) {
  const { data } = await api.get<ApiResponse<Queue>>(`/api/queues/${id}`)
  return data
}

export async function createQueue(payload: QueuePayload) {
  const { data } = await api.post<ApiResponse<Queue>>('/api/queues', payload)
  return data
}

export async function updateQueueStatus(id: number, status: QueueStatus) {
  const { data } = await api.patch<ApiResponse<Queue>>(`/api/queues/${id}/status`, { status })
  return data
}

export async function callQueue(id: number) {
  const { data } = await api.patch<ApiResponse<Queue>>(`/api/queues/${id}/call`)
  return data
}

export async function completeQueue(id: number) {
  const { data } = await api.patch<ApiResponse<Queue>>(`/api/queues/${id}/complete`)
  return data
}

export async function cancelQueue(id: number) {
  const { data } = await api.patch<ApiResponse<Queue>>(`/api/queues/${id}/cancel`)
  return data
}
