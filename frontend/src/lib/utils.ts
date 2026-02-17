import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const TIMEZONE = 'Asia/Makassar'

export const selectClass =
  'px-4 py-2 border-2 border-border shadow-md transition focus:outline-hidden focus:shadow-xs focus-visible:ring-2 focus-visible:ring-ring font-body bg-background cursor-pointer'

export function formatDateId(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TIMEZONE,
  })
}

export function formatDateTimeId(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  })
}

export function formatTimeId(dateStr: string | null): string | null {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  })
}

export function toWitaDateStr(d: Date = new Date()): string {
  return d.toLocaleDateString('en-CA', { timeZone: TIMEZONE })
}

export function getTodayStr(): string {
  return toWitaDateStr()
}
