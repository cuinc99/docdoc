import { useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AxiosError } from 'axios'
import { Upload } from 'lucide-react'
import { getClinicSettings, updateClinicSettings, uploadClinicLogo } from '@/api/settings'
import type { ApiResponse } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Input } from '@/components/retroui/Input'
import { PageHeader, EmptyState } from '@/components/shared'
import { useSnackbar } from '@/components/retroui/Snackbar'

const schema = z.object({
  clinic_name: z.string().min(1, 'Nama klinik wajib diisi'),
  clinic_address: z.string().nullable().optional(),
  clinic_phone: z.string().nullable().optional(),
  clinic_email: z.string().email('Email tidak valid').nullable().optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

export default function ClinicSettingsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['clinic-settings'],
    queryFn: getClinicSettings,
    enabled: user?.role === 'admin',
  })

  const settings = data?.data

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: settings
      ? {
          clinic_name: settings.clinic_name ?? '',
          clinic_address: settings.clinic_address ?? '',
          clinic_phone: settings.clinic_phone ?? '',
          clinic_email: settings.clinic_email ?? '',
        }
      : undefined,
  })

  const saveMutation = useMutation({
    mutationFn: updateClinicSettings,
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['clinic-settings'] })
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal menyimpan pengaturan', 'error')
    },
  })

  const logoMutation = useMutation({
    mutationFn: uploadClinicLogo,
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['clinic-settings'] })
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal mengunggah logo', 'error')
    },
  })

  const onSubmit = useCallback(
    (values: FormValues) => {
      saveMutation.mutate(values)
    },
    [saveMutation]
  )

  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        logoMutation.mutate(file)
      }
    },
    [logoMutation]
  )

  if (user?.role !== 'admin') {
    return (
      <div>
        <PageHeader title="Pengaturan Klinik" />
        <EmptyState message="Anda tidak memiliki akses ke halaman ini" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Pengaturan Klinik" />

      {isLoading ? (
        <EmptyState loading message="" />
      ) : (
        <div className="space-y-6">
          <div className="border-2 border-border p-4 shadow-md">
            <Text as="h2" className="text-lg mb-4">Logo Klinik</Text>
            <div className="flex items-center gap-4">
              {settings?.clinic_logo && (
                <img
                  src={settings.clinic_logo}
                  alt="Logo Klinik"
                  className="w-20 h-20 object-contain border-2 border-border"
                />
              )}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={logoMutation.isPending}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {logoMutation.isPending ? 'Mengunggah...' : 'Unggah Logo'}
                </Button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="border-2 border-border p-4 shadow-md space-y-4">
            <Text as="h2" className="text-lg">Informasi Klinik</Text>

            <div>
              <label className="text-sm font-body font-medium">Nama Klinik *</label>
              <Input {...register('clinic_name')} placeholder="Nama klinik" />
              {errors.clinic_name && (
                <p className="text-sm text-destructive font-body mt-1">{errors.clinic_name.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-body font-medium">Alamat</label>
              <textarea
                {...register('clinic_address')}
                rows={3}
                placeholder="Alamat klinik"
                className="w-full px-4 py-2 border-2 border-border shadow-md transition focus:outline-hidden focus:shadow-xs focus-visible:ring-2 focus-visible:ring-ring font-body bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-body font-medium">Telepon</label>
              <Input {...register('clinic_phone')} placeholder="Nomor telepon" />
            </div>

            <div>
              <label className="text-sm font-body font-medium">Email</label>
              <Input {...register('clinic_email')} type="email" placeholder="Email klinik" />
              {errors.clinic_email && (
                <p className="text-sm text-destructive font-body mt-1">{errors.clinic_email.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => reset()}>
                Reset
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
