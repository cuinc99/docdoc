import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Phone, CheckCircle, XCircle, Activity, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { getQueues, callQueue, completeQueue, cancelQueue, updateQueueStatus } from '@/api/queues'
import type { Queue, QueueStatus } from '@/api/queues'
import { getDoctors } from '@/api/doctors'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Badge } from '@/components/retroui/Badge'
import { Input } from '@/components/retroui/Input'
import { useSnackbar } from '@/components/retroui/Snackbar'
import { AddQueueDialog } from '@/components/queues/AddQueueDialog'

const selectClass =
  'px-4 py-2 border-2 border-border shadow-md transition focus:outline-hidden focus:shadow-xs focus-visible:ring-2 focus-visible:ring-ring font-body bg-background cursor-pointer'

const statusConfig: Record<QueueStatus, { label: string; color: string }> = {
  waiting: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800' },
  vitals: { label: 'Tanda Vital', color: 'bg-blue-100 text-blue-800' },
  in_consultation: { label: 'Konsultasi', color: 'bg-green-100 text-green-800' },
  completed: { label: 'Selesai', color: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-600' },
}

const statusOrder: QueueStatus[] = ['waiting', 'vitals', 'in_consultation', 'completed', 'cancelled']

const TIMEZONE = 'Asia/Makassar'

function toWitaDateStr(d: Date = new Date()) {
  const parts = d.toLocaleDateString('en-CA', { timeZone: TIMEZONE })
  return parts
}

function getTodayStr() {
  return toWitaDateStr()
}

function getYesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return toWitaDateStr(d)
}

function formatDateLabel(dateStr: string) {
  const today = getTodayStr()
  const yesterday = getYesterdayStr()
  const d = new Date(dateStr + 'T00:00:00')
  const label = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TIMEZONE })
  if (dateStr === today) return `Hari Ini - ${label}`
  if (dateStr === yesterday) return `Kemarin - ${label}`
  return label
}

export default function QueuePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const isDoctor = user?.role === 'doctor'
  const isReceptionist = user?.role === 'receptionist'
  const isAdmin = user?.role === 'admin'
  const canAdd = isAdmin || isReceptionist

  const [selectedDate, setSelectedDate] = useState(getTodayStr)
  const [doctorFilter, setDoctorFilter] = useState<string>('')
  const [addOpen, setAddOpen] = useState(false)

  const isToday = selectedDate === getTodayStr()

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => getDoctors(),
    enabled: !isDoctor,
  })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['queues', doctorFilter, selectedDate],
    queryFn: () =>
      getQueues({
        doctor_id: doctorFilter ? Number(doctorFilter) : undefined,
        date: selectedDate,
      }),
    refetchInterval: isToday ? 30000 : false,
  })

  const callMutation = useMutation({
    mutationFn: (id: number) => callQueue(id),
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['queues'] })
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal memanggil pasien', 'error')
    },
  })

  const completeMutation = useMutation({
    mutationFn: (id: number) => completeQueue(id),
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['queues'] })
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal menyelesaikan konsultasi', 'error')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelQueue(id),
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['queues'] })
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal membatalkan antrian', 'error')
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: QueueStatus }) => updateQueueStatus(id, status),
    onSuccess: (res) => {
      showSnackbar(res.message, 'success')
      queryClient.invalidateQueries({ queryKey: ['queues'] })
    },
    onError: (error: AxiosError<ApiResponse>) => {
      showSnackbar(error.response?.data?.message || 'Gagal mengubah status', 'error')
    },
  })

  const handleDoctorFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => setDoctorFilter(e.target.value),
    []
  )

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value),
    []
  )

  const handlePrevDay = useCallback(() => {
    setSelectedDate((prev) => {
      const [y, m, d] = prev.split('-').map(Number)
      const date = new Date(y, m - 1, d - 1)
      const newDate = toWitaDateStr(date)
      const minDate = getYesterdayStr()
      return newDate < minDate ? minDate : newDate
    })
  }, [])

  const handleNextDay = useCallback(() => {
    setSelectedDate((prev) => {
      const [y, m, d] = prev.split('-').map(Number)
      const date = new Date(y, m - 1, d + 1)
      return toWitaDateStr(date)
    })
  }, [])

  const handleToday = useCallback(() => setSelectedDate(getTodayStr()), [])

  const handleOpenAdd = useCallback(() => setAddOpen(true), [])
  const handleCloseAdd = useCallback(() => setAddOpen(false), [])
  const handleRefresh = useCallback(() => { refetch() }, [refetch])

  const queues = data?.data ?? []

  const grouped = useMemo(() => {
    const groups: Record<QueueStatus, Queue[]> = {
      waiting: [],
      vitals: [],
      in_consultation: [],
      completed: [],
      cancelled: [],
    }
    for (const q of queues) {
      groups[q.status]?.push(q)
    }
    return groups
  }, [queues])

  const summary = useMemo(() => ({
    waiting: grouped.waiting.length + grouped.vitals.length,
    inConsultation: grouped.in_consultation.length,
    completed: grouped.completed.length,
    total: queues.length,
  }), [grouped, queues.length])

  const canCall = useCallback(
    (q: Queue) => isAdmin || (isDoctor && user?.id === q.doctor_id),
    [isAdmin, isDoctor, user]
  )

  const canComplete = useCallback(
    (q: Queue) => isAdmin || (isDoctor && user?.id === q.doctor_id),
    [isAdmin, isDoctor, user]
  )

  const canCancel = useCallback(
    (_q: Queue) => isAdmin || isReceptionist,
    [isAdmin, isReceptionist]
  )

  const canUpdateStatus = useCallback(
    (_q: Queue) => isAdmin || isReceptionist,
    [isAdmin, isReceptionist]
  )

  const canPrevDay = selectedDate > getYesterdayStr()

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <Text as="h1" className="text-2xl lg:text-3xl">Antrian</Text>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          {canAdd && (
            <Button onClick={handleOpenAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah ke Antrian
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevDay} disabled={!canPrevDay}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            min={getYesterdayStr()}
            className="w-auto"
          />
          <Button variant="outline" size="sm" onClick={handleNextDay}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          {!isToday && (
            <Button variant="outline" size="sm" onClick={handleToday}>
              Hari Ini
            </Button>
          )}
        </div>
        <span className="text-sm text-muted-foreground font-body">
          {formatDateLabel(selectedDate)}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="border-2 border-border p-3 shadow-md text-center">
          <p className="text-2xl font-heading font-bold">{summary.waiting}</p>
          <p className="text-xs text-muted-foreground font-body">Menunggu</p>
        </div>
        <div className="border-2 border-border p-3 shadow-md text-center">
          <p className="text-2xl font-heading font-bold">{summary.inConsultation}</p>
          <p className="text-xs text-muted-foreground font-body">Dilayani</p>
        </div>
        <div className="border-2 border-border p-3 shadow-md text-center">
          <p className="text-2xl font-heading font-bold">{summary.completed}</p>
          <p className="text-xs text-muted-foreground font-body">Selesai</p>
        </div>
        <div className="border-2 border-border p-3 shadow-md text-center">
          <p className="text-2xl font-heading font-bold">{summary.total}</p>
          <p className="text-xs text-muted-foreground font-body">Total</p>
        </div>
      </div>

      {!isDoctor && (
        <div className="mb-4">
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
        </div>
      )}

      {isLoading ? (
        <div className="border-2 border-border p-8 text-center text-muted-foreground font-body">
          Memuat data...
        </div>
      ) : queues.length === 0 ? (
        <div className="border-2 border-border p-8 text-center text-muted-foreground font-body">
          Belum ada antrian pada tanggal ini
        </div>
      ) : (
        <div className="space-y-6">
          {statusOrder.map((status) => {
            const items = grouped[status]
            if (items.length === 0) return null

            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <Text as="h2" className="text-lg">{statusConfig[status].label}</Text>
                  <Badge variant="default" size="sm">{items.length}</Badge>
                </div>

                <div className="space-y-2">
                  {items.map((q) => (
                    <div
                      key={q.id}
                      className="border-2 border-border p-4 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-heading font-bold shrink-0">
                          {q.queue_number}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-heading font-medium">{q.patient?.name}</span>
                            <span className="text-xs font-mono text-muted-foreground">{q.patient?.mr_number}</span>
                            {q.priority === 'urgent' && (
                              <Badge className="bg-red-500 text-white" size="sm">URGENT</Badge>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded font-body ${statusConfig[q.status].color}`}>
                              {statusConfig[q.status].label}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground font-body">
                            Dr. {q.doctor?.name}
                            {q.patient?.gender === 'male' ? ' | L' : ' | P'}
                            {q.patient?.phone ? ` | ${q.patient.phone}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-wrap">
                        {q.status === 'waiting' && canUpdateStatus(q) && (
                          <button
                            onClick={() => statusMutation.mutate({ id: q.id, status: 'vitals' })}
                            className="p-1.5 border-2 border-border hover:bg-accent transition-colors cursor-pointer"
                            title="Input Tanda Vital"
                            aria-label={`Input tanda vital ${q.patient?.name}`}
                          >
                            <Activity className="w-4 h-4" />
                          </button>
                        )}
                        {(q.status === 'waiting' || q.status === 'vitals') && canCall(q) && (
                          <button
                            onClick={() => callMutation.mutate(q.id)}
                            className="p-1.5 border-2 border-green-600 text-green-600 hover:bg-green-50 transition-colors cursor-pointer"
                            title="Panggil Pasien"
                            aria-label={`Panggil ${q.patient?.name}`}
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                        )}
                        {q.status === 'in_consultation' && canComplete(q) && (
                          <button
                            onClick={() => completeMutation.mutate(q.id)}
                            className="p-1.5 border-2 border-green-600 text-green-600 hover:bg-green-50 transition-colors cursor-pointer"
                            title="Selesai Konsultasi"
                            aria-label={`Selesaikan konsultasi ${q.patient?.name}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {q.status !== 'completed' && q.status !== 'cancelled' && canCancel(q) && (
                          <button
                            onClick={() => cancelMutation.mutate(q.id)}
                            className="p-1.5 border-2 border-destructive text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            title="Batalkan"
                            aria-label={`Batalkan antrian ${q.patient?.name}`}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AddQueueDialog open={addOpen} onClose={handleCloseAdd} date={selectedDate} />
    </div>
  )
}
