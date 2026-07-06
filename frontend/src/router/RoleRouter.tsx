import { Navigate } from 'react-router-dom'
import { homePathOf, useUser } from '@/stores/authStore'

/** Redirects the root path to the correct portal home based on role. */
export default function RoleRouter() {
  const user = useUser()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={homePathOf(user)} replace />
}
