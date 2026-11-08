import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardRedirect from './components/DashboardRedirect'
import Home from './pages/Home'
import CreateTraining from './pages/CreateTraining'
import EditTraining from './pages/EditTraining'
import StudentDashboard from './pages/StudentDashboard'
import ProfessorDashboard from './pages/ProfessorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import CreateEvent from './pages/CreateEvent'
import EditEvent from './pages/EditEvent'
import EventDetail from './pages/EventDetail'
import ProfilePage from './pages/ProfilePage'
import Agenda from './pages/Agenda'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardRedirect />} />
              <Route path="/dashboard/atleta" element={<StudentDashboard />} />
              <Route path="/dashboard/professor" element={<ProfessorDashboard />} />
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route path="/criar-treino" element={<CreateTraining />} />
              <Route path="/editar-treino/:id" element={<EditTraining />} />
              <Route path="/criar-evento" element={<CreateEvent />} />
              <Route path="/editar-evento/:id" element={<EditEvent />} />
              <Route path="/evento/:id" element={<EventDetail />} />
              <Route path="/perfil" element={<ProfilePage />} />
              <Route path="/agenda" element={<Agenda />} />
            </Route>
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
