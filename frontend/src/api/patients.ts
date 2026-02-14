import api from '@/api/axios'
import type { ApiResponse } from '@/types'

export interface Patient {
  id: number
  mr_number: string
  nik: string
  name: string
  gender: 'male' | 'female'
  birth_date: string
  phone: string
  email: string | null
  address: string
  blood_type: 'A' | 'B' | 'AB' | 'O' | null
  allergies: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  created_at: string
  updated_at: string
}

export interface PatientListParams {
  page?: number
  per_page?: number
  search?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  message: string
  errors: null
}

export type PatientPayload = Omit<Patient, 'id' | 'mr_number' | 'created_at' | 'updated_at'>

export async function getPatients(params: PatientListParams = {}) {
  const { data } = await api.get<PaginatedResponse<Patient>>('/api/patients', { params })
  return data
}

export async function getPatient(id: number) {
  const { data } = await api.get<ApiResponse<Patient>>(`/api/patients/${id}`)
  return data
}

export async function createPatient(payload: PatientPayload) {
  const { data } = await api.post<ApiResponse<Patient>>('/api/patients', payload)
  return data
}

export async function updatePatient(id: number, payload: PatientPayload) {
  const { data } = await api.put<ApiResponse<Patient>>(`/api/patients/${id}`, payload)
  return data
}

export async function deletePatient(id: number) {
  const { data } = await api.delete<ApiResponse<null>>(`/api/patients/${id}`)
  return data
}
