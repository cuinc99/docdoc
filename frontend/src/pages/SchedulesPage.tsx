import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { getSchedules, toggleSchedule } from '@/api/schedules'
import type { Schedule } from '@/api/schedules'
import { getDoctors } from '@/api/doctors'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Badge } from '@/components/retroui/Badge'
import { useSnackbar } from '@/components/retroui/Snackbar'
import { ScheduleDialog } from '@/components/schedules/ScheduleDialog'
import { DeleteScheduleDialog } from '@/components/schedules/DeleteScheduleDialog'

const selectClass =
  'px-4 py-2 border-2 border-border shadow-md transition focus:outline-hidden focus:shadow-xs focus-visible:ring-2 focus-visible:ring-ring font-body bg-background cursor-pointer'

function getWeekRange(offset: number) {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay() + 1 + offset * 7)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SchedulesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const isDoctor = user?.role === 'doctor'
  const canManage = user?.role === 'admin' || user?.role === 'doctor'

  const [weekOffset, setWeekOffset] = useState(0)
  const [doctorFilter, setDoctorFilter] = useState<string>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editSchedule, setEditSchedule] = useState<Schedule | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null)

  const { from, to } = useMemo(() => getWeekRange(weekOffset), [weekOffset])

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => getDoctors(),
    enabled: !isDoctor,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['schedules', doctorFilter, from, to],
    queryFn: () =>
      getSchedules({
        doctor_id: doctorFilter ? Number(doctorFilter) : undefined,
        date_from: from,
        date_to: to,
      }),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleSchedule(id),
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal mengubah status', 'error')
    },
  })

  const handleDoctorFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => setDoctorFilter(e.target.value),
    []
  )

  const handlePrevWeek = useCallback(() => setWeekOffset((o) => o - 1), [])
  const handleNextWeek = useCallback(() => setWeekOffset((o) => o + 1), [])
  const handleThisWeek = useCallback(() => setWeekOffset(0), [])
  const handleOpenCreate = useCallback(() => setCreateOpen(true), [])
  const handleCloseCreate = useCallback(() => setCreateOpen(false), [])
  const handleCloseEdit = useCallback(() => setEditSchedule(undefined), [])
  const handleCloseDelete = useCallback(() => setDeleteTarget(null), [])

  const canModify = useCallback(
    (schedule: Schedule) => {
      if (user?.role === 'admin') return true
      return isDoctor && user?.id === schedule.doctor_id
    },
    [user, isDoctor]
  )

  const schedules = data?.data ?? []

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <Text as="h1" className="text-2xl lg:text-3xl">Jadwal Dokter</Text>
        {canManage && (
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Jadwal
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {!isDoctor && (
          <select
            value={doctorFilter}
            onChange={handleDoctorFilterChange}
            className={selectClass}
            aria-label="Filter dokter"
          >
            <option value="">Semua Dokter</option>
            {doctorsData?.data?.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name}{doc.specialization ? ` - ${doc.specialization}` : ''}
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevWeek}>
            &larr;
          </Button>
          <Button variant="outline" size="sm" onClick={handleThisWeek}>
            Minggu Ini
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            &rarr;
          </Button>
          <span className="text-sm text-muted-foreground font-body ml-2">
            {formatDate(from)} - {formatDate(to)}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="border-2 border-border p-8 text-center text-muted-foreground font-body">
            Memuat data...
          </div>
        ) : schedules.length === 0 ? (
          <div className="border-2 border-border p-8 text-center text-muted-foreground font-body">
            Tidak ada jadwal pada periode ini
          </div>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              className={`border-2 border-border p-4 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                !schedule.is_available ? 'opacity-60' : ''
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-heading font-medium">{schedule.doctor?.name}</span>
                  {schedule.doctor?.specialization && (
                    <Badge variant="default" size="sm">{schedule.doctor.specialization}</Badge>
                  )}
                  <Badge
                    variant={schedule.is_available ? 'surface' : 'outline'}
                    size="sm"
                  >
                    {schedule.is_available ? 'Tersedia' : 'Tidak Tersedia'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-body">
                  {formatDate(schedule.date)} &middot; {schedule.start_time?.slice(0, 5)} - {schedule.end_time?.slice(0, 5)}
                </p>
                {schedule.notes && (
                  <p className="text-sm text-muted-foreground font-body mt-1">{schedule.notes}</p>
                )}
              </div>
              {canModify(schedule) && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleMutation.mutate(schedule.id)}
                    className="p-1.5 border-2 border-border hover:bg-accent transition-colors cursor-pointer"
                    title={schedule.is_available ? 'Nonaktifkan' : 'Aktifkan'}
                    aria-label={schedule.is_available ? 'Nonaktifkan jadwal' : 'Aktifkan jadwal'}
                  >
                    {schedule.is_available ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setEditSchedule(schedule)}
                    className="p-1.5 border-2 border-border hover:bg-accent transition-colors cursor-pointer"
                    title="Edit"
                    aria-label={`Edit jadwal ${schedule.doctor?.name}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(schedule)}
                    className="p-1.5 border-2 border-destructive text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    title="Hapus"
                    aria-label={`Hapus jadwal ${schedule.doctor?.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <ScheduleDialog open={createOpen} onClose={handleCloseCreate} />
      <ScheduleDialog
        open={!!editSchedule}
        onClose={handleCloseEdit}
        schedule={editSchedule}
      />
      <DeleteScheduleDialog
        open={!!deleteTarget}
        onClose={handleCloseDelete}
        schedule={deleteTarget}
      />
    </div>
  )
}
