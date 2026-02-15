import api from '@/api/axios'
import type { ApiResponse } from '@/types'

export interface Doctor {
  id: number
  name: string
  specialization: string | null
  sip_number: string | null
}

export async function getDoctors() {
  const { data } = await api.get<ApiResponse<Doctor[]>>('/api/doctors')
  return data
}
