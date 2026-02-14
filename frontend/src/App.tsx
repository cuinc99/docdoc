import { QueryProvider } from '@/lib/query'
import { SnackbarProvider } from '@/components/retroui/Snackbar'
import { AppRouter } from '@/routes'

function App() {
  return (
    <QueryProvider>
      <SnackbarProvider>
        <AppRouter />
      </SnackbarProvider>
    </QueryProvider>
  )
}

export default App
