import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AxiosError } from 'axios'
import { getProfile, updateProfile, updatePassword } from '@/api/users'
import type { ApiResponse } from '@/types'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Input } from '@/components/retroui/Input'
import { PageHeader, EmptyState } from '@/components/shared'
import { useSnackbar } from '@/components/retroui/Snackbar'

const profileSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  phone: z.string().nullable().optional(),
})

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Password saat ini wajib diisi'),
    password: z.string().min(8, 'Password baru minimal 8 karakter'),
    password_confirmation: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Password tidak cocok',
    path: ['password_confirmation'],
  })

type ProfileFormValues = z.infer<typeof profileSchema>
type PasswordFormValues = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const profile = data?.data

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: profile
      ? { name: profile.name, phone: profile.phone ?? '' }
      : undefined,
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', password: '', password_confirmation: '' },
  })

  const profileMutation = useMutation({
    mutationFn: (values: { name: string; phone?: string | null }) => updateProfile(values),
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal memperbarui profil', 'error')
    },
  })

  const passwordMutation = useMutation({
    mutationFn: updatePassword,
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      resetPassword()
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal mengubah password', 'error')
    },
  })

  const onProfileSubmit = useCallback(
    (values: ProfileFormValues) => {
      profileMutation.mutate({ name: values.name, phone: values.phone || null })
    },
    [profileMutation]
  )

  const onPasswordSubmit = useCallback(
    (values: PasswordFormValues) => {
      passwordMutation.mutate(values)
    },
    [passwordMutation]
  )

  return (
    <div>
      <PageHeader title="Profil" />

      {isLoading ? (
        <EmptyState loading message="" />
      ) : (
        <div className="space-y-6">
          <form
            onSubmit={handleProfileSubmit(onProfileSubmit)}
            className="border-2 border-border p-4 shadow-md space-y-4"
          >
            <Text as="h2" className="text-lg">Informasi Profil</Text>

            <div>
              <label className="text-sm font-body font-medium">Nama *</label>
              <Input {...registerProfile('name')} placeholder="Nama lengkap" />
              {profileErrors.name && (
                <p className="text-sm text-destructive font-body mt-1">{profileErrors.name.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-body font-medium">Telepon</label>
              <Input {...registerProfile('phone')} placeholder="Nomor telepon" />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? 'Menyimpan...' : 'Simpan Profil'}
              </Button>
            </div>
          </form>

          <form
            onSubmit={handlePasswordSubmit(onPasswordSubmit)}
            className="border-2 border-border p-4 shadow-md space-y-4"
          >
            <Text as="h2" className="text-lg">Ubah Password</Text>

            <div>
              <label className="text-sm font-body font-medium">Password Saat Ini *</label>
              <Input {...registerPassword('current_password')} type="password" placeholder="Password saat ini" />
              {passwordErrors.current_password && (
                <p className="text-sm text-destructive font-body mt-1">{passwordErrors.current_password.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-body font-medium">Password Baru *</label>
              <Input {...registerPassword('password')} type="password" placeholder="Minimal 8 karakter" />
              {passwordErrors.password && (
                <p className="text-sm text-destructive font-body mt-1">{passwordErrors.password.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-body font-medium">Konfirmasi Password Baru *</label>
              <Input {...registerPassword('password_confirmation')} type="password" placeholder="Ulangi password baru" />
              {passwordErrors.password_confirmation && (
                <p className="text-sm text-destructive font-body mt-1">{passwordErrors.password_confirmation.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending ? 'Mengubah...' : 'Ubah Password'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
