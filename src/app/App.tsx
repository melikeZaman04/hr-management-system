import { Outlet } from 'react-router-dom'
import { AuthProvider } from '../features/auth/AuthProvider'

export function App() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}
