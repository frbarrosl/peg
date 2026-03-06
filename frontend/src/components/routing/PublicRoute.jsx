import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/" replace /> : children
}
