import { useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Phone, Mail, MapPin, Droplets, AlertTriangle, UserCheck } from 'lucide-react'
import { getPatient } from '@/api/patients'
import { Text } from '@/components/retroui/Text'
import { Button } from '@/components/retroui/Button'
import { Card } from '@/components/retroui/Card'
import { Badge } from '@/components/retroui/Badge'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function calcAge(dateStr: string): number {
  return Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  )
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => getPatient(Number(id)),
    enabled: !!id,
  })

  const patient = data?.data

  const handleBack = useCallback(() => navigate('/patients'), [navigate])

  const age = patient ? calcAge(patient.birth_date) : 0
  const birthDateFormatted = patient ? formatDate(patient.birth_date) : ''

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground font-body">Memuat data pasien...</p>
      </div>
    )
  }

  if (isError || !patient) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-muted-foreground font-body">Pasien tidak ditemukan</p>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={handleBack} aria-label="Kembali ke daftar pasien">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <Text as="h1" className="text-2xl lg:text-3xl">{patient.name}</Text>
          <p className="text-sm text-muted-foreground font-body font-mono">{patient.mr_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="w-full">
          <Card.Header>
            <Card.Title>Informasi Pribadi</Card.Title>
          </Card.Header>
          <Card.Content>
            <dl className="space-y-3 font-body text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">NIK</dt>
                <dd className="font-mono font-medium">{patient.nik}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-muted-foreground">Jenis Kelamin</dt>
                <dd>
                  <Badge variant="default" size="sm">
                    {patient.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tanggal Lahir</dt>
                <dd>{birthDateFormatted} ({age} tahun)</dd>
              </div>
              {patient.blood_type && (
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5" /> Golongan Darah
                  </dt>
                  <dd>
                    <Badge variant="surface" size="sm">{patient.blood_type}</Badge>
                  </dd>
                </div>
              )}
            </dl>
          </Card.Content>
        </Card>

        <Card className="w-full">
          <Card.Header>
            <Card.Title>Kontak</Card.Title>
          </Card.Header>
          <Card.Content>
            <dl className="space-y-3 font-body text-sm">
              <div className="flex items-start gap-2">
                <dt className="shrink-0">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                </dt>
                <dd>{patient.phone}</dd>
              </div>
              {patient.email && (
                <div className="flex items-start gap-2">
                  <dt className="shrink-0">
                    <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                  </dt>
                  <dd>{patient.email}</dd>
                </div>
              )}
              <div className="flex items-start gap-2">
                <dt className="shrink-0">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                </dt>
                <dd>{patient.address}</dd>
              </div>
            </dl>
          </Card.Content>
        </Card>

        {(patient.allergies || patient.emergency_contact_name) && (
          <Card className="w-full lg:col-span-2">
            <Card.Header>
              <Card.Title>Informasi Tambahan</Card.Title>
            </Card.Header>
            <Card.Content>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 font-body text-sm">
                {patient.allergies && (
                  <div>
                    <dt className="text-muted-foreground flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Alergi
                    </dt>
                    <dd>
                      <Badge variant="surface" size="sm" className="bg-destructive text-destructive-foreground">
                        {patient.allergies}
                      </Badge>
                    </dd>
                  </div>
                )}
                {patient.emergency_contact_name && (
                  <div>
                    <dt className="text-muted-foreground flex items-center gap-1 mb-1">
                      <UserCheck className="w-3.5 h-3.5" /> Kontak Darurat
                    </dt>
                    <dd className="font-medium">
                      {patient.emergency_contact_name}
                      {patient.emergency_contact_phone && (
                        <span className="text-muted-foreground ml-2">({patient.emergency_contact_phone})</span>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </Card.Content>
          </Card>
        )}

        <Card className="w-full lg:col-span-2">
          <Card.Header>
            <Card.Title>Riwayat Kunjungan</Card.Title>
          </Card.Header>
          <Card.Content>
            <p className="text-muted-foreground font-body text-sm">
              Belum ada riwayat kunjungan.
            </p>
          </Card.Content>
        </Card>
      </div>
    </div>
  )
}
