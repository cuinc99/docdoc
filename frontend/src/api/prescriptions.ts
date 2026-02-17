import api from '@/api/axios'
import type { ApiResponse } from '@/types'

export interface PrescriptionItem {
  drug_name: string
  dosage: string
  frequency: string
  duration?: string | null
  quantity: number
  instructions?: string | null
}

export interface Prescription {
  id: number
  prescription_number: string
  patient_id: number
  doctor_id: number
  medical_record_id: number
  items: PrescriptionItem[]
  notes: string | null
  is_dispensed: boolean
  dispensed_at: string | null
  dispensed_by: number | null
  patient?: { id: number; name: string; mr_number: string }
  doctor?: { id: number; name: string; specialization: string | null; sip_number: string | null }
  dispensed_by_user?: { id: number; name: string } | null
  created_at: string
  updated_at: string
}

export interface PrescriptionPayload {
  medical_record_id: number
  items: PrescriptionItem[]
  notes?: string | null
}

export interface PrescriptionListParams {
  patient_id?: number
  medical_record_id?: number
  is_dispensed?: boolean
  search?: string
  page?: number
  per_page?: number
}

export interface PaginatedPrescriptions {
  data: Prescription[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
  message: string
  errors: null
}

export async function getPrescriptions(params: PrescriptionListParams = {}) {
  const { data } = await api.get<PaginatedPrescriptions>('/api/prescriptions', { params })
  return data
}

export async function getPrescription(id: number) {
  const { data } = await api.get<ApiResponse<Prescription>>(`/api/prescriptions/${id}`)
  return data
}

export async function createPrescription(payload: PrescriptionPayload) {
  const { data } = await api.post<ApiResponse<Prescription>>('/api/prescriptions', payload)
  return data
}

export async function updatePrescription(id: number, payload: Omit<PrescriptionPayload, 'medical_record_id'>) {
  const { data } = await api.put<ApiResponse<Prescription>>(`/api/prescriptions/${id}`, payload)
  return data
}

export async function dispensePrescription(id: number) {
  const { data } = await api.patch<ApiResponse<Prescription>>(`/api/prescriptions/${id}/dispense`)
  return data
}

export async function downloadPrescriptionPdf(id: number) {
  const response = await api.get(`/api/prescriptions/${id}/pdf`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `resep-${id}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
