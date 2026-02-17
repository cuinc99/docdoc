import api from '@/api/axios'
import type { ApiResponse } from '@/types'

export interface InvoiceItem {
  description: string
  quantity: number
  unit_price: string
  total: string
}

export interface PaymentData {
  id: number
  amount: string
  method: string
  reference: string | null
  received_by: number
  received_by_user?: { id: number; name: string } | null
  created_at: string
}

export interface Invoice {
  id: number
  invoice_number: string
  patient_id: number
  items: InvoiceItem[]
  subtotal: string
  discount: string
  tax: string
  total: string
  paid_amount: string
  status: 'pending' | 'partial' | 'paid' | 'cancelled'
  patient?: { id: number; name: string; mr_number: string }
  payments?: PaymentData[]
  created_at: string
  updated_at: string
}

export interface InvoicePayload {
  patient_id: number
  items: { description: string; quantity: number; unit_price: number }[]
  discount?: number
  tax_percent?: number
}

export interface InvoiceListParams {
  patient_id?: number
  status?: string
  search?: string
  page?: number
  per_page?: number
}

export interface PaginatedInvoices {
  data: Invoice[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
  message: string
  errors: null
}

export async function getInvoices(params: InvoiceListParams = {}) {
  const { data } = await api.get<PaginatedInvoices>('/api/invoices', { params })
  return data
}

export async function getInvoice(id: number) {
  const { data } = await api.get<ApiResponse<Invoice>>(`/api/invoices/${id}`)
  return data
}

export async function createInvoice(payload: InvoicePayload) {
  const { data } = await api.post<ApiResponse<Invoice>>('/api/invoices', payload)
  return data
}

export async function updateInvoice(id: number, payload: InvoicePayload) {
  const { data } = await api.put<ApiResponse<Invoice>>(`/api/invoices/${id}`, payload)
  return data
}

export async function addPayment(invoiceId: number, payload: { amount: number; method: string; reference?: string }) {
  const { data } = await api.post<ApiResponse<Invoice>>(`/api/invoices/${invoiceId}/payments`, payload)
  return data
}

export async function cancelInvoice(id: number) {
  const { data } = await api.patch<ApiResponse<Invoice>>(`/api/invoices/${id}/cancel`)
  return data
}

export async function downloadInvoicePdf(id: number) {
  const response = await api.get(`/api/invoices/${id}/pdf`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `invoice-${id}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
