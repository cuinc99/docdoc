import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/retroui/Button'
import { Input } from '@/components/retroui/Input'
import { Card } from '@/components/retroui/Card'
import { Text } from '@/components/retroui/Text'

const registerSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(255),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  password_confirmation: z.string().min(1, 'Konfirmasi password wajib diisi'),
  phone: z.string().max(20).optional().or(z.literal('')),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Konfirmasi password tidak cocok',
  path: ['password_confirmation'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { register: registerUser, isRegisterLoading } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = useCallback(async (data: RegisterForm) => {
    try {
      await registerUser(data)
    } catch {
      // handled by useAuth
    }
  }, [registerUser])

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8 bg-background">
      <Card className="w-full max-w-md">
        <Card.Header>
          <div className="text-center mb-2">
            <Text as="h1" className="text-3xl mb-1">DocDoc</Text>
            <p className="text-muted-foreground font-body">Sistem Manajemen Klinik</p>
          </div>
          <Card.Title className="text-center">Daftar Akun</Card.Title>
        </Card.Header>
        <Card.Content>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1 font-body">Nama Lengkap</label>
              <Input
                id="name"
                placeholder="Masukkan nama lengkap"
                autoComplete="name"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              {errors.name && (
                <p className="text-destructive text-sm mt-1 font-body">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 font-body">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-destructive text-sm mt-1 font-body">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1 font-body">Telepon</label>
              <Input
                id="phone"
                placeholder="08xxxxxxxxxx"
                autoComplete="tel"
                aria-invalid={!!errors.phone}
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-destructive text-sm mt-1 font-body">{errors.phone.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1 font-body">Password</label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 8 karakter"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-destructive text-sm mt-1 font-body">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password_confirmation" className="block text-sm font-medium mb-1 font-body">Konfirmasi Password</label>
              <Input
                id="password_confirmation"
                type="password"
                placeholder="Ulangi password"
                autoComplete="new-password"
                aria-invalid={!!errors.password_confirmation}
                {...register('password_confirmation')}
              />
              {errors.password_confirmation && (
                <p className="text-destructive text-sm mt-1 font-body">{errors.password_confirmation.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full justify-center" disabled={isRegisterLoading}>
              {isRegisterLoading ? 'Memproses...' : 'Daftar'}
            </Button>
          </form>
          <p className="text-center text-sm mt-4 font-body">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Login di sini
            </Link>
          </p>
        </Card.Content>
      </Card>
    </div>
  )
}
