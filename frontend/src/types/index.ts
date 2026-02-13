export type Role = 'admin' | 'doctor' | 'receptionist'

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  role: Role
  specialization: string | null
  sip_number: string | null
  avatar: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ApiResponse<T = unknown> {
  data: T
  message: string
  errors: Record<string, string[]> | null
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
  phone?: string
}
