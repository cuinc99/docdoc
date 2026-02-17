import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AxiosError } from 'axios'
import { Plus, X } from 'lucide-react'
import { getServices, createService, updateService } from '@/api/services'
import type { Service } from '@/api/services'
import type { ApiResponse } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Input } from '@/components/retroui/Input'
import { Badge } from '@/components/retroui/Badge'
import { PageHeader, EmptyState } from '@/components/shared'
import { useSnackbar } from '@/components/retroui/Snackbar'

function formatRupiah(value: string | number) {
  return 'Rp ' + Number(value).toLocaleString('id-ID')
}

const serviceSchema = z.object({
  name: z.string().min(1, 'Nama layanan wajib diisi'),
  price: z.number().min(0, 'Harga tidak boleh negatif'),
})

type ServiceFormValues = { name: string; price: number }

interface ServiceDialogProps {
  open: boolean
  onClose: () => void
  service?: Service
}

function ServiceDialog({ open, onClose, service }: ServiceDialogProps) {
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const isEdit = !!service

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service
      ? { name: service.name, price: Number(service.price) }
      : { name: '', price: 0 },
  })

  useEffect(() => {
    if (open && service) {
      reset({ name: service.name, price: Number(service.price) })
    } else if (open && !service) {
      reset({ name: '', price: 0 })
    }
  }, [open, service, reset])

  const mutation = useMutation({
    mutationFn: (data: { name: string; price: number }) =>
      isEdit ? updateService(service.id, data) : createService(data),
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['services'] })
      onClose()
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Terjadi kesalahan', 'error')
    },
  })

  const onSubmit = useCallback(
    (values: ServiceFormValues) => {
      mutation.mutate(values)
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
        aria-label={isEdit ? 'Edit Layanan' : 'Tambah Layanan'}
        className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto bg-background border-2 border-border shadow-lg p-6 overscroll-contain"
      >
        <div className="flex items-center justify-between mb-4">
          <Text as="h2" className="text-xl">
            {isEdit ? 'Edit Layanan' : 'Tambah Layanan Baru'}
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
            <label className="text-sm font-body font-medium">Nama Layanan *</label>
            <Input {...register('name')} placeholder="Nama layanan" />
            {errors.name && <p className="text-sm text-destructive font-body mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="text-sm font-body font-medium">Harga (Rp) *</label>
            <Input {...register('price', { valueAsNumber: true })} type="number" min={0} placeholder="0" />
            {errors.price && <p className="text-sm text-destructive font-body mt-1">{errors.price.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Layanan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ServicesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const [createOpen, setCreateOpen] = useState(false)
  const [editService, setEditService] = useState<Service | undefined>()

  const { data, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: getServices,
    enabled: user?.role === 'admin',
  })

  const toggleMutation = useMutation({
    mutationFn: (service: Service) =>
      updateService(service.id, {
        name: service.name,
        price: Number(service.price),
        is_active: !service.is_active,
      }),
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal mengubah status', 'error')
    },
  })

  const handleOpenCreate = useCallback(() => setCreateOpen(true), [])
  const handleCloseCreate = useCallback(() => setCreateOpen(false), [])
  const handleCloseEdit = useCallback(() => setEditService(undefined), [])

  if (user?.role !== 'admin') {
    return (
      <div>
        <PageHeader title="Layanan" />
        <EmptyState message="Anda tidak memiliki akses ke halaman ini" />
      </div>
    )
  }

  const services = data?.data ?? []

  return (
    <div>
      <PageHeader title="Layanan">
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-1" /> Tambah Layanan
        </Button>
      </PageHeader>

      <div className="space-y-3">
        {isLoading ? (
          <EmptyState loading message="" />
        ) : services.length === 0 ? (
          <EmptyState message="Belum ada data layanan" />
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className="border-2 border-border p-4 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-heading font-medium">{service.name}</span>
                  <Badge
                    variant={service.is_active ? 'surface' : 'outline'}
                    size="sm"
                  >
                    {service.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-body">
                  Harga: <span className="font-medium text-foreground">{formatRupiah(service.price)}</span>
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditService(service)}
                  className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-body border-2 border-border hover:bg-accent transition-colors cursor-pointer"
                  title="Edit"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleMutation.mutate(service)}
                  className={`inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-body border-2 transition-colors cursor-pointer ${
                    service.is_active
                      ? 'border-destructive text-destructive hover:bg-destructive/10'
                      : 'border-green-600 text-green-600 hover:bg-green-50'
                  }`}
                  title={service.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {service.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ServiceDialog open={createOpen} onClose={handleCloseCreate} />
      <ServiceDialog open={!!editService} onClose={handleCloseEdit} service={editService} />
    </div>
  )
}
