import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Phone, CheckCircle, XCircle, Activity, RefreshCw, ChevronLeft, ChevronRight, Stethoscope, Edit, Clock, Users, UserCheck, CalendarCheck, Filter } from 'lucide-react'
import { getQueues, callQueue, completeQueue, cancelQueue } from '@/api/queues'
import type { Queue, QueueStatus } from '@/api/queues'
import { getDoctors } from '@/api/doctors'
import { getVitalSigns } from '@/api/vitalSigns'
import { getMedicalRecords } from '@/api/medicalRecords'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Badge } from '@/components/retroui/Badge'
import { Input } from '@/components/retroui/Input'
import { Select } from '@/components/retroui/Select'
import { useSnackbar } from '@/components/retroui/Snackbar'
import { AddQueueDialog } from '@/components/queues/AddQueueDialog'
import { PageHeader, ActionButton, EmptyState } from '@/components/shared'
import { toWitaDateStr, getTodayStr, formatTimeId } from '@/lib/utils'

const statusConfig: Record<QueueStatus, { label: string; color: string; dot: string }> = {
  waiting: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400' },
  vitals: { label: 'Tanda Vital', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-400' },
  in_consultation: { label: 'Konsultasi', color: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  completed: { label: 'Selesai', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-600', dot: 'bg-red-400' },
}

const statusOrder: QueueStatus[] = ['in_consultation', 'vitals', 'waiting', 'completed', 'cancelled']

const TIMEZONE = 'Asia/Makassar'

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
  const navigate = useNavigate()
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

  const queues = data?.data ?? []
  const queueIds = useMemo(() => queues.map((q) => q.id), [queues])

  const { data: vitalsData } = useQuery({
    queryKey: ['vital-signs-for-queues', selectedDate, doctorFilter],
    queryFn: () => getVitalSigns({}),
    enabled: queueIds.length > 0,
  })

  const { data: recordsData } = useQuery({
    queryKey: ['medical-records-for-queues', selectedDate, doctorFilter],
    queryFn: () => getMedicalRecords({ per_page: 100 }),
    enabled: queueIds.length > 0,
  })

  const vitalsMap = useMemo(() => {
    const map = new Map<number, number>()
    if (vitalsData?.data) {
      for (const vs of vitalsData.data) {
        map.set(vs.queue_id, vs.id)
      }
    }
    return map
  }, [vitalsData])

  const recordsMap = useMemo(() => {
    const map = new Map<number, number>()
    if (recordsData?.data) {
      for (const rec of recordsData.data) {
        map.set(rec.queue_id, rec.id)
      }
    }
    return map
  }, [recordsData])

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
      return toWitaDateStr(date)
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
    cancelled: grouped.cancelled.length,
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

  const renderProgressIndicators = useCallback((q: Queue) => {
    const hasVitals = vitalsMap.has(q.id)
    const hasRecord = recordsMap.has(q.id)
    if (q.status === 'cancelled') return null
    return (
      <div className="flex items-center gap-1.5 text-xs font-body">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${hasVitals ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
          <Activity className="w-3 h-3" />
          Vital
        </span>
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${hasRecord ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
          <Stethoscope className="w-3 h-3" />
          Rekam
        </span>
      </div>
    )
  }, [vitalsMap, recordsMap])

  const renderActions = useCallback((q: Queue) => {
    const actions: React.ReactNode[] = []

    if ((q.status === 'waiting' || q.status === 'vitals') && canUpdateStatus(q)) {
      if (vitalsMap.has(q.id)) {
        actions.push(
          <ActionButton
            key="edit-vitals"
            icon={<Edit className="w-4 h-4" />}
            label="Edit Vital"
            onClick={() => navigate(`/queue/${q.id}/vitals`)}
          />
        )
      } else {
        actions.push(
          <ActionButton
            key="add-vitals"
            icon={<Activity className="w-4 h-4" />}
            label="Input Vital"
            onClick={() => navigate(`/queue/${q.id}/vitals`)}
          />
        )
      }
    }

    if ((q.status === 'waiting' || q.status === 'vitals') && canCall(q)) {
      actions.push(
        <ActionButton
          key="call"
          icon={<Phone className="w-4 h-4" />}
          label="Panggil"
          variant="success"
          onClick={() => callMutation.mutate(q.id)}
        />
      )
    }

    if (q.status === 'in_consultation' && canComplete(q)) {
      if (recordsMap.has(q.id)) {
        actions.push(
          <ActionButton
            key="edit-record"
            icon={<Edit className="w-4 h-4" />}
            label="Edit Rekam Medis"
            onClick={() => navigate(`/medical-records/${recordsMap.get(q.id)}/edit`)}
          />
        )
      } else {
        actions.push(
          <ActionButton
            key="consultation"
            icon={<Stethoscope className="w-4 h-4" />}
            label="Buat Rekam Medis"
            onClick={() => navigate(`/queue/${q.id}/consultation`)}
          />
        )
      }

      actions.push(
        <ActionButton
          key="complete"
          icon={<CheckCircle className="w-4 h-4" />}
          label="Selesai"
          variant="success"
          onClick={() => completeMutation.mutate(q.id)}
        />
      )
    }

    if (q.status === 'completed' && recordsMap.has(q.id)) {
      actions.push(
        <ActionButton
          key="view-record"
          icon={<Stethoscope className="w-4 h-4" />}
          label="Lihat Rekam Medis"
          onClick={() => navigate(`/medical-records/${recordsMap.get(q.id)}`)}
        />
      )
    }

    if (q.status !== 'completed' && q.status !== 'cancelled' && canCancel(q)) {
      actions.push(
        <ActionButton
          key="cancel"
          icon={<XCircle className="w-4 h-4" />}
          label="Batal"
          variant="destructive"
          onClick={() => cancelMutation.mutate(q.id)}
        />
      )
    }

    return actions.length > 0 ? <div className="flex items-center gap-1 flex-wrap">{actions}</div> : null
  }, [vitalsMap, recordsMap, canUpdateStatus, canCall, canComplete, canCancel, navigate, callMutation, completeMutation, cancelMutation])

  return (
    <div>
      <PageHeader title="Antrian Pasien">
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
        {canAdd && (
          <Button onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Antrian
          </Button>
        )}
      </PageHeader>

      <div className="border-2 border-border p-4 shadow-md mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevDay}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-body font-medium">
              {formatDateLabel(selectedDate)}
            </span>
            {isToday && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-body">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            )}
          </div>
        </div>

        {!isDoctor && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select
                value={doctorFilter}
                onChange={handleDoctorFilterChange}
                className="min-w-[160px]"
                aria-label="Filter dokter"
              >
                <option value="">Semua Dokter</option>
                {doctorsData?.data?.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}{doc.specialization ? ` - ${doc.specialization}` : ''}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="border-2 border-border p-3 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-2xl font-heading font-bold">{summary.waiting}</span>
          </div>
          <p className="text-xs text-muted-foreground font-body font-medium">Menunggu</p>
        </div>
        <div className="border-2 border-border p-3 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <UserCheck className="w-4 h-4 text-green-600" />
            <span className="text-2xl font-heading font-bold">{summary.inConsultation}</span>
          </div>
          <p className="text-xs text-muted-foreground font-body font-medium">Konsultasi</p>
        </div>
        <div className="border-2 border-border p-3 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <CalendarCheck className="w-4 h-4 text-muted-foreground" />
            <span className="text-2xl font-heading font-bold">{summary.completed}</span>
          </div>
          <p className="text-xs text-muted-foreground font-body font-medium">Selesai</p>
        </div>
        <div className="border-2 border-border p-3 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-2xl font-heading font-bold">{summary.total}</span>
          </div>
          <p className="text-xs text-muted-foreground font-body font-medium">Total</p>
        </div>
      </div>

      {isLoading ? (
        <EmptyState loading message="" />
      ) : queues.length === 0 ? (
        <EmptyState message="Belum ada antrian pada tanggal ini" />
      ) : (
        <div className="space-y-6">
          {statusOrder.map((status) => {
            const items = grouped[status]
            if (items.length === 0) return null

            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusConfig[status].dot}`} />
                  <Text as="h2" className="text-base">{statusConfig[status].label}</Text>
                  <Badge variant="default" size="sm">{items.length}</Badge>
                </div>

                <div className="space-y-2">
                  {items.map((q) => (
                    <div
                      key={q.id}
                      className="border-2 border-border p-4 shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-heading font-bold shrink-0 ${
                            q.priority === 'urgent'
                              ? 'bg-red-500 text-white'
                              : 'bg-primary text-primary-foreground'
                          }`}>
                            {q.queue_number}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span className="font-heading font-medium">{q.patient?.name}</span>
                              <span className="text-xs font-mono text-muted-foreground">{q.patient?.mr_number}</span>
                              {q.priority === 'urgent' && (
                                <Badge className="bg-red-500 text-white" size="sm">URGENT</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground font-body mb-2">
                              <span>Dr. {q.doctor?.name}</span>
                              <span className="text-border">|</span>
                              <span>{q.patient?.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</span>
                              {q.patient?.phone && (
                                <>
                                  <span className="text-border">|</span>
                                  <span>{q.patient.phone}</span>
                                </>
                              )}
                              {q.called_at && (
                                <>
                                  <span className="text-border">|</span>
                                  <span>Dipanggil {formatTimeId(q.called_at)}</span>
                                </>
                              )}
                              {q.completed_at && (
                                <>
                                  <span className="text-border">|</span>
                                  <span>Selesai {formatTimeId(q.completed_at)}</span>
                                </>
                              )}
                            </div>
                            {renderProgressIndicators(q)}
                          </div>
                        </div>

                        {renderActions(q)}
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
