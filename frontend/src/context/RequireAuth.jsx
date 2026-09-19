import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireAuth() {
  const { user, booting } = useAuth()

  // While the stored session is being re-validated, hold the route instead of
  // flashing a redirect to /signin on every refresh.
  if (booting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="w-5 h-5 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
          Restoring your session…
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/signin" replace />
  return <Outlet />
}
