import { useCallback, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { X } from 'lucide-react'
import { createPatient, updatePatient } from '@/api/patients'
import type { Patient, PatientPayload } from '@/api/patients'
import type { ApiResponse } from '@/types'
import { PatientFormFields } from './PatientFormFields'
import { Text } from '@/components/retroui/Text'
import { useSnackbar } from '@/components/retroui/Snackbar'

interface PatientDialogProps {
  open: boolean
  onClose: () => void
  patient?: Patient
}

export function PatientDialog({ open, onClose, patient }: PatientDialogProps) {
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const isEdit = !!patient

  const mutation = useMutation({
    mutationFn: (data: PatientPayload) =>
      isEdit ? updatePatient(patient.id, data) : createPatient(data),
    onSuccess: (data) => {
      showSnackbar(data.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ['patient', String(patient.id)] })
      }
      onClose()
    },
    onError: (error: AxiosError<ApiResponse>) => {
      const message = error.response?.data?.message || 'Terjadi kesalahan'
      showSnackbar(message, 'error')
    },
  })

  const handleSubmit = useCallback(
    (data: PatientPayload) => {
      mutation.mutate(data)
    },
    [mutation]
  )

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Edit Pasien' : 'Tambah Pasien'}
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-2 border-border shadow-lg p-6 overscroll-contain"
      >
        <div className="flex items-center justify-between mb-4">
          <Text as="h2" className="text-xl">
            {isEdit ? 'Edit Pasien' : 'Tambah Pasien Baru'}
          </Text>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-border hover:bg-accent transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <PatientFormFields
          key={patient?.id ?? 'create'}
          defaultValues={patient}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isLoading={mutation.isPending}
          submitLabel={isEdit ? 'Simpan Perubahan' : 'Tambah Pasien'}
        />
      </div>
    </div>
  )
}
