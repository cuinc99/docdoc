import api from '@/api/axios'
import type { ApiResponse } from '@/types'

export interface ClinicSettings {
  clinic_name: string | null
  clinic_address: string | null
  clinic_phone: string | null
  clinic_email: string | null
  clinic_logo: string | null
}

export async function getClinicSettings() {
  const { data } = await api.get<ApiResponse<ClinicSettings>>('/api/settings/clinic')
  return data
}

export async function updateClinicSettings(payload: Partial<ClinicSettings>) {
  const { data } = await api.put<ApiResponse<ClinicSettings>>('/api/settings/clinic', payload)
  return data
}

export async function uploadClinicLogo(file: File) {
  const formData = new FormData()
  formData.append('logo', file)
  const { data } = await api.post<ApiResponse<{ url: string }>>('/api/settings/clinic/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
