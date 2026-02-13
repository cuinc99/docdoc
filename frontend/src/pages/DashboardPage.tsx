import { useAuth } from '@/hooks/useAuth'
import { Text } from '@/components/retroui/Text'
import { Card } from '@/components/retroui/Card'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div>
      <Text as="h1" className="text-2xl lg:text-3xl mb-6">Dashboard</Text>
      <Card className="w-full">
        <Card.Content>
          <Text as="h2" className="text-xl mb-2">
            Selamat datang, {user?.name}
          </Text>
          <p className="text-muted-foreground font-body">
            Role: <span className="capitalize font-medium">{user?.role}</span>
          </p>
        </Card.Content>
      </Card>
    </div>
  )
}
