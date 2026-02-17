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

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login, isLoginLoading } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = useCallback(async (data: LoginForm) => {
    try {
      await login(data)
    } catch {
      // handled by useAuth
    }
  }, [login])

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-background">
      <Card className="w-full max-w-md">
        <Card.Header>
          <div className="text-center mb-2">
            <Text as="h1" className="text-3xl mb-1">DocDoc</Text>
            <p className="text-muted-foreground font-body">Sistem Manajemen Klinik</p>
          </div>
          <Card.Title className="text-center">Login</Card.Title>
        </Card.Header>
        <Card.Content>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <label htmlFor="password" className="block text-sm font-medium mb-1 font-body">Password</label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-destructive text-sm mt-1 font-body">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full justify-center" disabled={isLoginLoading}>
              {isLoginLoading ? 'Memproses...' : 'Login'}
            </Button>
          </form>
          <p className="text-center text-sm mt-4 font-body">
            Belum punya akun?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Daftar di sini
            </Link>
          </p>
        </Card.Content>
      </Card>
    </div>
  )
}
