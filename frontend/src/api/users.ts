import api from '@/api/axios'
import type { ApiResponse, User } from '@/types'

export interface UserPayload {
  name: string
  email: string
  password?: string
  phone?: string | null
  role: string
  specialization?: string | null
  sip_number?: string | null
}

export interface UserListParams {
  search?: string
  role?: string
  page?: number
  per_page?: number
}

export interface PaginatedUsers {
  data: User[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
  message: string
  errors: null
}

export async function getUsers(params: UserListParams = {}) {
  const { data } = await api.get<PaginatedUsers>('/api/users', { params })
  return data
}

export async function createUser(payload: UserPayload) {
  const { data } = await api.post<ApiResponse<User>>('/api/users', payload)
  return data
}

export async function updateUser(id: number, payload: UserPayload) {
  const { data } = await api.put<ApiResponse<User>>(`/api/users/${id}`, payload)
  return data
}

export async function toggleUserActive(id: number) {
  const { data } = await api.patch<ApiResponse<User>>(`/api/users/${id}/toggle-active`)
  return data
}

export async function getProfile() {
  const { data } = await api.get<ApiResponse<User>>('/api/profile')
  return data
}

export async function updateProfile(payload: { name: string; phone?: string | null }) {
  const { data } = await api.put<ApiResponse<User>>('/api/profile', payload)
  return data
}

export async function updatePassword(payload: { current_password: string; password: string; password_confirmation: string }) {
  const { data } = await api.put<ApiResponse<null>>('/api/profile/password', payload)
  return data
}
