import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AxiosError } from 'axios'
import { Plus, Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { getUsers, createUser, updateUser, toggleUserActive } from '@/api/users'
import type { UserPayload } from '@/api/users'
import type { ApiResponse, User } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Input } from '@/components/retroui/Input'
import { Badge } from '@/components/retroui/Badge'
import { PageHeader, EmptyState } from '@/components/shared'
import { useSnackbar } from '@/components/retroui/Snackbar'
import { selectClass } from '@/lib/utils'

const staffSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Email tidak valid'),
  password: z.string().optional(),
  phone: z.string().nullable().optional(),
  role: z.string().min(1, 'Role wajib dipilih'),
  specialization: z.string().nullable().optional(),
  sip_number: z.string().nullable().optional(),
})

type StaffFormValues = z.infer<typeof staffSchema>

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  doctor: 'Dokter',
  receptionist: 'Resepsionis',
}

interface StaffDialogProps {
  open: boolean
  onClose: () => void
  staff?: User
}

function StaffDialog({ open, onClose, staff }: StaffDialogProps) {
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const isEdit = !!staff

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<StaffFormValues>({
    resolver: zodResolver(
      isEdit
        ? staffSchema
        : staffSchema.extend({ password: z.string().min(8, 'Password minimal 8 karakter') })
    ),
    defaultValues: staff
      ? {
          name: staff.name,
          email: staff.email,
          phone: staff.phone ?? '',
          role: staff.role,
          specialization: staff.specialization ?? '',
          sip_number: staff.sip_number ?? '',
        }
      : { name: '', email: '', password: '', phone: '', role: '', specialization: '', sip_number: '' },
  })

  const selectedRole = watch('role')

  useEffect(() => {
    if (open && staff) {
      reset({
        name: staff.name,
        email: staff.email,
        phone: staff.phone ?? '',
        role: staff.role,
        specialization: staff.specialization ?? '',
        sip_number: staff.sip_number ?? '',
      })
    } else if (open && !staff) {
      reset({ name: '', email: '', password: '', phone: '', role: '', specialization: '', sip_number: '' })
    }
  }, [open, staff, reset])

  const mutation = useMutation({
    mutationFn: (data: UserPayload) =>
      isEdit ? updateUser(staff.id, data) : createUser(data),
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Terjadi kesalahan', 'error')
    },
  })

  const onSubmit = useCallback(
    (values: StaffFormValues) => {
      const payload: UserPayload = {
        name: values.name,
        email: values.email,
        role: values.role,
        phone: values.phone || null,
        specialization: values.role === 'doctor' ? (values.specialization || null) : null,
        sip_number: values.role === 'doctor' ? (values.sip_number || null) : null,
      }
      if (!isEdit && values.password) {
        payload.password = values.password
      }
      mutation.mutate(payload)
    },
    [mutation, isEdit]
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
        aria-label={isEdit ? 'Edit Staff' : 'Tambah Staff'}
        className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background border-2 border-border shadow-lg p-6 overscroll-contain"
      >
        <div className="flex items-center justify-between mb-4">
          <Text as="h2" className="text-xl">
            {isEdit ? 'Edit Staff' : 'Tambah Staff Baru'}
          </Text>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-border hover:bg-accent transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-body font-medium">Nama *</label>
            <Input {...register('name')} placeholder="Nama lengkap" />
            {errors.name && <p className="text-sm text-destructive font-body mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="text-sm font-body font-medium">Email *</label>
            <Input {...register('email')} type="email" placeholder="Email" />
            {errors.email && <p className="text-sm text-destructive font-body mt-1">{errors.email.message}</p>}
          </div>

          {!isEdit && (
            <div>
              <label className="text-sm font-body font-medium">Password *</label>
              <Input {...register('password')} type="password" placeholder="Minimal 8 karakter" />
              {errors.password && <p className="text-sm text-destructive font-body mt-1">{errors.password.message}</p>}
            </div>
          )}

          <div>
            <label className="text-sm font-body font-medium">Telepon</label>
            <Input {...register('phone')} placeholder="Nomor telepon" />
          </div>

          <div>
            <label className="text-sm font-body font-medium">Role *</label>
            <select {...register('role')} className={selectClass + ' w-full'}>
              <option value="">-- Pilih Role --</option>
              <option value="admin">Admin</option>
              <option value="doctor">Dokter</option>
              <option value="receptionist">Resepsionis</option>
            </select>
            {errors.role && <p className="text-sm text-destructive font-body mt-1">{errors.role.message}</p>}
          </div>

          {selectedRole === 'doctor' && (
            <>
              <div>
                <label className="text-sm font-body font-medium">Spesialisasi</label>
                <Input {...register('specialization')} placeholder="Spesialisasi" />
              </div>
              <div>
                <label className="text-sm font-body font-medium">No. SIP</label>
                <Input {...register('sip_number')} placeholder="Nomor SIP" />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Staff'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function StaffPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editStaff, setEditStaff] = useState<User | undefined>()

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, searchQuery, roleFilter],
    queryFn: () => getUsers({
      page,
      per_page: 10,
      search: searchQuery || undefined,
      ...(roleFilter !== 'all' ? { role: roleFilter } : {}),
    }),
    enabled: user?.role === 'admin',
  })

  const toggleMutation = useMutation({
    mutationFn: toggleUserActive,
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal mengubah status', 'error')
    },
  })

  const handleRoleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value)
    setPage(1)
  }, [])

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setSearchQuery(search)
      setPage(1)
    },
    [search]
  )

  const handlePrevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), [])
  const handleNextPage = useCallback(
    () => setPage((p) => (data?.meta && p < data.meta.last_page ? p + 1 : p)),
    [data?.meta]
  )

  const handleOpenCreate = useCallback(() => setCreateOpen(true), [])
  const handleCloseCreate = useCallback(() => setCreateOpen(false), [])
  const handleCloseEdit = useCallback(() => setEditStaff(undefined), [])

  if (user?.role !== 'admin') {
    return (
      <div>
        <PageHeader title="Staff" />
        <EmptyState message="Anda tidak memiliki akses ke halaman ini" />
      </div>
    )
  }

  const users = data?.data ?? []
  const meta = data?.meta

  return (
    <div>
      <PageHeader title="Staff">
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-1" /> Tambah Staff
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">Cari</Button>
        </form>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select value={roleFilter} onChange={handleRoleFilterChange} className={selectClass + ' min-w-[160px]'}>
            <option value="all">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="doctor">Dokter</option>
            <option value="receptionist">Resepsionis</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <EmptyState loading message="" />
        ) : users.length === 0 ? (
          <EmptyState message={searchQuery ? 'Tidak ada staff ditemukan' : 'Belum ada data staff'} />
        ) : (
          users.map((u) => (
            <div
              key={u.id}
              className="border-2 border-border p-4 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-heading font-medium">{u.name}</span>
                  <Badge variant="default" size="sm">{roleLabels[u.role] ?? u.role}</Badge>
                  <Badge
                    variant={u.is_active ? 'surface' : 'outline'}
                    size="sm"
                  >
                    {u.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-body">
                  {u.email}
                  {u.phone ? ` · ${u.phone}` : ''}
                  {u.specialization ? ` · ${u.specialization}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditStaff(u)}
                  className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-body border-2 border-border hover:bg-accent transition-colors cursor-pointer"
                  title="Edit"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleMutation.mutate(u.id)}
                  className={`inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-body border-2 transition-colors cursor-pointer ${
                    u.is_active
                      ? 'border-destructive text-destructive hover:bg-destructive/10'
                      : 'border-green-600 text-green-600 hover:bg-green-50'
                  }`}
                  title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground font-body">
            Hal {meta.current_page} dari {meta.last_page} ({meta.total} data)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={page <= 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={page >= meta.last_page}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <StaffDialog open={createOpen} onClose={handleCloseCreate} />
      <StaffDialog open={!!editStaff} onClose={handleCloseEdit} staff={editStaff} />
    </div>
  )
}
