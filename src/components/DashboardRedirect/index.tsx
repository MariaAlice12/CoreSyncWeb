import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/auth'

/** Manda cada perfil para o próprio painel. */
function DashboardRedirect() {
  const { userRole } = useAuth()
  if (userRole === 'aluno') return <Navigate to="/dashboard/atleta" replace />
  if (userRole === 'admin') return <Navigate to="/dashboard/admin" replace />
  return <Navigate to="/dashboard/professor" replace />
}

export default DashboardRedirect
