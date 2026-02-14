import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/retroui/Button'
import { Input } from '@/components/retroui/Input'
import type { Patient, PatientPayload } from '@/api/patients'

const patientSchema = z.object({
  nik: z.string().length(16, 'NIK harus 16 digit'),
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  gender: z.enum(['male', 'female'], { error: 'Jenis kelamin wajib dipilih' }),
  birth_date: z.string().min(1, 'Tanggal lahir wajib diisi'),
  phone: z.string().min(1, 'Nomor telepon wajib diisi'),
  email: z.string().email('Format email tidak valid').or(z.literal('')).optional(),
  address: z.string().min(1, 'Alamat wajib diisi'),
  blood_type: z.enum(['A', 'B', 'AB', 'O', '']).optional(),
  allergies: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
})

type PatientForm = z.infer<typeof patientSchema>

interface PatientFormFieldsProps {
  defaultValues?: Patient
  onSubmit: (data: PatientPayload) => Promise<void>
  onCancel: () => void
  isLoading: boolean
  submitLabel: string
}

function normalizeDateToInput(dateStr: string | undefined | null): string {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

const selectClass =
  'px-4 py-2 w-full border-2 border-border shadow-md transition focus:outline-hidden focus:shadow-xs focus-visible:ring-2 focus-visible:ring-ring font-body bg-background cursor-pointer'
const textareaClass =
  'px-4 py-2 w-full border-2 border-border shadow-md transition focus:outline-hidden focus:shadow-xs focus-visible:ring-2 focus-visible:ring-ring font-body bg-background'

export function PatientFormFields({ defaultValues, onSubmit, onCancel, isLoading, submitLabel }: PatientFormFieldsProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: defaultValues
      ? {
          nik: defaultValues.nik,
          name: defaultValues.name,
          gender: defaultValues.gender,
          birth_date: normalizeDateToInput(defaultValues.birth_date),
          phone: defaultValues.phone,
          email: defaultValues.email ?? '',
          address: defaultValues.address,
          blood_type: defaultValues.blood_type ?? '',
          allergies: defaultValues.allergies ?? '',
          emergency_contact_name: defaultValues.emergency_contact_name ?? '',
          emergency_contact_phone: defaultValues.emergency_contact_phone ?? '',
        }
      : { gender: undefined, blood_type: '' },
  })

  const handleFormSubmit = useCallback(
    async (data: PatientForm) => {
      await onSubmit({
        ...data,
        email: data.email || null,
        blood_type: (data.blood_type as 'A' | 'B' | 'AB' | 'O') || null,
        allergies: data.allergies || null,
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
      })
    },
    [onSubmit]
  )

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="nik" className="block text-sm font-medium mb-1 font-body">NIK *</label>
          <Input id="nik" placeholder="16 digit NIK" maxLength={16} autoComplete="off" aria-invalid={!!errors.nik} {...register('nik')} />
          {errors.nik && <p className="text-destructive text-sm mt-1 font-body">{errors.nik.message}</p>}
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1 font-body">Nama Lengkap *</label>
          <Input id="name" placeholder="Nama lengkap pasien" autoComplete="off" aria-invalid={!!errors.name} {...register('name')} />
          {errors.name && <p className="text-destructive text-sm mt-1 font-body">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="gender" className="block text-sm font-medium mb-1 font-body">Jenis Kelamin *</label>
          <select id="gender" className={selectClass} autoComplete="off" aria-invalid={!!errors.gender} {...register('gender')}>
            <option value="">Pilih jenis kelamin</option>
            <option value="male">Laki-laki</option>
            <option value="female">Perempuan</option>
          </select>
          {errors.gender && <p className="text-destructive text-sm mt-1 font-body">{errors.gender.message}</p>}
        </div>
        <div>
          <label htmlFor="birth_date" className="block text-sm font-medium mb-1 font-body">Tanggal Lahir *</label>
          <Input id="birth_date" type="date" autoComplete="off" aria-invalid={!!errors.birth_date} {...register('birth_date')} />
          {errors.birth_date && <p className="text-destructive text-sm mt-1 font-body">{errors.birth_date.message}</p>}
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1 font-body">Telepon *</label>
          <Input id="phone" placeholder="08xxxxxxxxxx" autoComplete="tel" aria-invalid={!!errors.phone} {...register('phone')} />
          {errors.phone && <p className="text-destructive text-sm mt-1 font-body">{errors.phone.message}</p>}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1 font-body">Email</label>
          <Input id="email" type="email" placeholder="email@contoh.com" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
          {errors.email && <p className="text-destructive text-sm mt-1 font-body">{errors.email.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium mb-1 font-body">Alamat *</label>
        <textarea
          id="address"
          rows={3}
          placeholder="Alamat lengkap"
          className={textareaClass}
          autoComplete="off"
          aria-invalid={!!errors.address}
          {...register('address')}
        />
        {errors.address && <p className="text-destructive text-sm mt-1 font-body">{errors.address.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="blood_type" className="block text-sm font-medium mb-1 font-body">Golongan Darah</label>
          <select id="blood_type" className={selectClass} autoComplete="off" {...register('blood_type')}>
            <option value="">Tidak diketahui</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="AB">AB</option>
            <option value="O">O</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="allergies" className="block text-sm font-medium mb-1 font-body">Alergi</label>
          <Input id="allergies" placeholder="Alergi obat/makanan (jika ada)" autoComplete="off" {...register('allergies')} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="emergency_contact_name" className="block text-sm font-medium mb-1 font-body">Nama Kontak Darurat</label>
          <Input id="emergency_contact_name" placeholder="Nama kontak darurat" autoComplete="off" {...register('emergency_contact_name')} />
        </div>
        <div>
          <label htmlFor="emergency_contact_phone" className="block text-sm font-medium mb-1 font-body">Telepon Kontak Darurat</label>
          <Input id="emergency_contact_phone" placeholder="08xxxxxxxxxx" autoComplete="off" {...register('emergency_contact_phone')} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Batal
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Menyimpan...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
