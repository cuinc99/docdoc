import api from '@/api/axios'
import type { ApiResponse } from '@/types'

export interface VitalSign {
  id: number
  patient_id: number
  queue_id: number
  recorded_by: number
  systolic: number
  diastolic: number
  heart_rate: number
  temperature: number
  respiratory_rate: number
  oxygen_saturation: number | null
  weight: number
  height: number
  bmi: number
  chief_complaint: string
  notes: string | null
  patient?: { id: number; name: string; mr_number: string }
  queue?: { id: number; queue_number: number; date: string; doctor_id: number }
  recorder?: { id: number; name: string }
  created_at: string
  updated_at: string
}

export interface VitalSignPayload {
  queue_id: number
  systolic: number
  diastolic: number
  heart_rate: number
  temperature: number
  respiratory_rate: number
  oxygen_saturation?: number | null
  weight: number
  height: number
  chief_complaint: string
  notes?: string | null
}

export interface VitalSignListParams {
  patient_id?: number
  queue_id?: number
}

export async function getVitalSigns(params: VitalSignListParams = {}) {
  const { data } = await api.get<ApiResponse<VitalSign[]>>('/api/vital-signs', { params })
  return data
}

export async function getVitalSign(id: number) {
  const { data } = await api.get<ApiResponse<VitalSign>>(`/api/vital-signs/${id}`)
  return data
}

export async function createVitalSign(payload: VitalSignPayload) {
  const { data } = await api.post<ApiResponse<VitalSign>>('/api/vital-signs', payload)
  return data
}

export async function updateVitalSign(id: number, payload: Omit<VitalSignPayload, 'queue_id'>) {
  const { data } = await api.put<ApiResponse<VitalSign>>(`/api/vital-signs/${id}`, payload)
  return data
}

export async function deleteVitalSign(id: number) {
  const { data } = await api.delete<ApiResponse<null>>(`/api/vital-signs/${id}`)
  return data
}
