import api from '@/api/axios'
import type { ApiResponse } from '@/types'

export interface Icd10Item {
  code: string
  description: string
}

export async function searchIcd10(search: string = '') {
  const { data } = await api.get<ApiResponse<Icd10Item[]>>('/api/icd10', { params: { search } })
  return data
}
