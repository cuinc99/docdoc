import api from '@/api/axios'
import type { ApiResponse } from '@/types'

export interface Service {
  id: number
  name: string
  price: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getServices() {
  const { data } = await api.get<ApiResponse<Service[]>>('/api/services')
  return data
}

export async function createService(payload: { name: string; price: number }) {
  const { data } = await api.post<ApiResponse<Service>>('/api/services', payload)
  return data
}

export async function updateService(id: number, payload: { name: string; price: number; is_active?: boolean }) {
  const { data } = await api.put<ApiResponse<Service>>(`/api/services/${id}`, payload)
  return data
}

export async function deleteService(id: number) {
  const { data } = await api.delete<ApiResponse<null>>(`/api/services/${id}`)
  return data
}
