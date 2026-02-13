import { createContext, useContext, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import api from '@/api/axios'
import type { ApiResponse, User, LoginPayload, RegisterPayload } from '@/types'
import type { ReactNode } from 'react'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<ApiResponse<User>>
  register: (payload: RegisterPayload) => Promise<ApiResponse<User>>
  logout: () => Promise<ApiResponse>
  isLoginLoading: boolean
  isRegisterLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const hasSession = localStorage.getItem('has_session') === '1'

  const { data: user, isLoading, isError } = useQuery<User | null>({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const { data } = await api.get<ApiResponse<User>>('/api/user')
        return data.data
      } catch {
        localStorage.removeItem('has_session')
        return null
      }
    },
    enabled: hasSession,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const getCsrfCookie = useCallback(async () => {
    await api.get('/sanctum/csrf-cookie')
  }, [])

  const loginMutation = useMutation({
    mutationFn: async (payload: LoginPayload) => {
      await getCsrfCookie()
      const { data } = await api.post<ApiResponse<User>>('/api/login', payload)
      return data
    },
    onSuccess: (data) => {
      localStorage.setItem('has_session', '1')
      queryClient.setQueryData(['user'], data.data)
      toast.success(data.message)
      navigate('/dashboard')
    },
    onError: (error: AxiosError<ApiResponse>) => {
      const message = error.response?.data?.message || 'Login gagal'
      toast.error(message)
    },
  })

  const registerMutation = useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      await getCsrfCookie()
      const { data } = await api.post<ApiResponse<User>>('/api/register', payload)
      return data
    },
    onSuccess: (data) => {
      localStorage.setItem('has_session', '1')
      queryClient.setQueryData(['user'], data.data)
      toast.success(data.message)
      navigate('/dashboard')
    },
    onError: (error: AxiosError<ApiResponse>) => {
      const message = error.response?.data?.message || 'Registrasi gagal'
      toast.error(message)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse>('/api/logout')
      return data
    },
    onSuccess: (data) => {
      localStorage.removeItem('has_session')
      queryClient.setQueryData(['user'], null)
      queryClient.clear()
      toast.success(data.message)
      navigate('/login')
    },
  })

  const value = useMemo<AuthContextValue>(() => ({
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user && !isError,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
  }), [user, isLoading, isError, loginMutation, registerMutation, logoutMutation])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
