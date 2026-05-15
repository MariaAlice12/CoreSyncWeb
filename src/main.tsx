import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import CreateTraining from './pages/CreateTraining'
import EditTraining from './pages/EditTraining'
import StudentDashboard from './pages/StudentDashboard'
import ProfessorDashboard from './pages/ProfessorDashboard'

function DashboardRedirect() {
  const { userRole } = useAuth()
  return <Navigate to={userRole === 'aluno' ? '/dashboard/atleta' : '/dashboard/professor'} replace />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/dashboard/atleta" element={<StudentDashboard />} />
            <Route path="/dashboard/professor" element={<ProfessorDashboard />} />
            <Route path="/criar-treino" element={<CreateTraining />} />
            <Route path="/editar-treino/:id" element={<EditTraining />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
