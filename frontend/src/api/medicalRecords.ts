import api from '@/api/axios'
import type { ApiResponse } from '@/types'
import type { VitalSign } from '@/api/vitalSigns'

export interface Diagnosis {
  code: string
  description: string
  is_primary: boolean
}

export interface AddendumData {
  id: number
  doctor_id: number
  content: string
  doctor: { id: number; name: string } | null
  created_at: string
}

export interface MedicalRecord {
  id: number
  patient_id: number
  doctor_id: number
  queue_id: number
  vital_sign_id: number | null
  subjective: string
  objective: string
  assessment: string
  plan: string
  diagnoses: Diagnosis[]
  is_locked: boolean
  locked_at: string | null
  patient?: { id: number; name: string; mr_number: string; gender: string; birth_date: string }
  doctor?: { id: number; name: string; specialization: string | null }
  queue?: { id: number; queue_number: number; date: string }
  vital_sign?: VitalSign | null
  addendums?: AddendumData[]
  created_at: string
  updated_at: string
}

export interface MedicalRecordPayload {
  queue_id: number
  subjective: string
  objective: string
  assessment: string
  plan: string
  diagnoses: Diagnosis[]
}

export interface MedicalRecordListParams {
  patient_id?: number
  doctor_id?: number
  page?: number
  per_page?: number
}

export interface PaginatedMedicalRecords {
  data: MedicalRecord[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
  message: string
  errors: null
}

export async function getMedicalRecords(params: MedicalRecordListParams = {}) {
  const { data } = await api.get<PaginatedMedicalRecords>('/api/medical-records', { params })
  return data
}

export async function getMedicalRecord(id: number) {
  const { data } = await api.get<ApiResponse<MedicalRecord>>(`/api/medical-records/${id}`)
  return data
}

export async function createMedicalRecord(payload: MedicalRecordPayload) {
  const { data } = await api.post<ApiResponse<MedicalRecord>>('/api/medical-records', payload)
  return data
}

export async function updateMedicalRecord(id: number, payload: Omit<MedicalRecordPayload, 'queue_id'>) {
  const { data } = await api.put<ApiResponse<MedicalRecord>>(`/api/medical-records/${id}`, payload)
  return data
}

export async function createAddendum(recordId: number, content: string) {
  const { data } = await api.post<ApiResponse<AddendumData>>(`/api/medical-records/${recordId}/addendums`, { content })
  return data
}

export async function updateAddendum(recordId: number, addendumId: number, content: string) {
  const { data } = await api.put<ApiResponse<AddendumData>>(`/api/medical-records/${recordId}/addendums/${addendumId}`, { content })
  return data
}

export async function deleteAddendum(recordId: number, addendumId: number) {
  const { data } = await api.delete<ApiResponse<null>>(`/api/medical-records/${recordId}/addendums/${addendumId}`)
  return data
}
