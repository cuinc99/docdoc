import { Toaster } from 'sonner'
import { QueryProvider } from '@/lib/query'
import { AppRouter } from '@/routes'

function App() {
  return (
    <QueryProvider>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </QueryProvider>
  )
}

export default App
