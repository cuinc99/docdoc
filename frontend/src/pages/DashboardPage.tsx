import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  CalendarCheck,
  DollarSign,
  Activity,
  Clock,
  Pill,
  Receipt,
  UserPlus,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { getDashboard } from '@/api/dashboard'
import type { AdminDashboard, DoctorDashboard, ReceptionistDashboard } from '@/api/dashboard'
import { useAuth } from '@/hooks/useAuth'
import { Text } from '@/components/retroui/Text'
import { EmptyState } from '@/components/shared'
import { formatDateId, formatRupiah } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  iconColor: string
  value: string | number
  label: string
}

function StatCard({ icon: Icon, iconColor, value, label }: StatCardProps) {
  return (
    <div className="border-2 border-border p-4 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <span className="text-2xl font-heading font-bold">{value}</span>
      </div>
      <p className="text-sm text-muted-foreground font-body">{label}</p>
    </div>
  )
}

function AdminDashboardView({ data }: { data: AdminDashboard }) {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} iconColor="text-blue-500" value={data.total_patients} label="Total Pasien" />
        <StatCard icon={CalendarCheck} iconColor="text-green-500" value={data.today_visits} label="Kunjungan Hari Ini" />
        <StatCard icon={DollarSign} iconColor="text-yellow-500" value={formatRupiah(data.monthly_revenue)} label="Revenue Bulan Ini" />
        <StatCard icon={Activity} iconColor="text-orange-500" value={data.active_queues} label="Antrian Aktif" />
      </div>
      {data.visit_chart && data.visit_chart.length > 0 && (
        <div className="border-2 border-border p-4 shadow-md">
          <Text as="h2" className="text-lg mb-4">Grafik Kunjungan 30 Hari Terakhir</Text>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.visit_chart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) =>
                  new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                }
                fontSize={12}
              />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip
                labelFormatter={(v) =>
                  new Date(String(v)).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                }
              />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  )
}

function DoctorDashboardView({ data }: { data: DoctorDashboard }) {
  const navigate = useNavigate()

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} iconColor="text-blue-500" value={data.my_patients_today} label="Pasien Hari Ini" />
        <StatCard icon={Clock} iconColor="text-orange-500" value={data.my_active_queues} label="Antrian Aktif" />
        <StatCard icon={CalendarCheck} iconColor="text-green-500" value={`${data.recent_records.length} Terbaru`} label="Rekam Medis Terbaru" />
        <StatCard icon={Pill} iconColor="text-red-500" value={data.undispensed_prescriptions} label="Resep Belum Ditebus" />
      </div>
      {data.recent_records.length > 0 && (
        <div className="border-2 border-border p-4 shadow-md">
          <Text as="h2" className="text-lg mb-4">Rekam Medis Terbaru</Text>
          <div className="space-y-2">
            {data.recent_records.map((record) => (
              <div
                key={record.id}
                className="border border-border p-3 flex items-center justify-between cursor-pointer hover:bg-accent transition-colors"
                onClick={() => navigate(`/medical-records/${record.id}`)}
              >
                <div>
                  <span className="font-heading font-medium">{record.patient?.name ?? '-'}</span>
                  {record.patient?.mr_number && (
                    <span className="text-xs font-mono text-muted-foreground ml-2">{record.patient.mr_number}</span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground font-body">{formatDateId(record.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function ReceptionistDashboardView({ data }: { data: ReceptionistDashboard }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={CalendarCheck} iconColor="text-blue-500" value={data.today_queues} label="Antrian Hari Ini" />
      <StatCard icon={Receipt} iconColor="text-yellow-500" value={data.pending_invoices} label="Invoice Tertunda" />
      <StatCard icon={UserPlus} iconColor="text-green-500" value={data.new_patients_today} label="Pasien Baru Hari Ini" />
      <StatCard icon={DollarSign} iconColor="text-orange-500" value={formatRupiah(data.today_payments)} label="Pembayaran Hari Ini" />
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })

  const dashboardData = data?.data

  return (
    <div>
      <Text as="h1" className="text-2xl lg:text-3xl mb-6">Dashboard</Text>

      {isLoading ? (
        <EmptyState loading message="" />
      ) : !dashboardData ? (
        <EmptyState message="Tidak dapat memuat data dashboard" />
      ) : user?.role === 'admin' ? (
        <AdminDashboardView data={dashboardData as AdminDashboard} />
      ) : user?.role === 'doctor' ? (
        <DoctorDashboardView data={dashboardData as DoctorDashboard} />
      ) : (
        <ReceptionistDashboardView data={dashboardData as ReceptionistDashboard} />
      )}
    </div>
  )
}
