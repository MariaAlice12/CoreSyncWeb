import { useState, useEffect } from 'react'
import './style.css'
import { useAuth } from '../../contexts/AuthContext'
import { logout } from '../../services/auth.service'
import { getTrainings, enrollInTraining, getMyEnrollments, updateEnrollment } from '../../services/training.service'
import type { Training, Enrollment } from '../../types'
import { useNavigate } from 'react-router-dom'

type Tab = 'matricula' | 'meus-treinos' | 'cancelados'

const WEEKDAY_LABEL: Record<string, string> = {
  segunda: 'Segunda', terca: 'Terça', quarta: 'Quarta',
  quinta: 'Quinta', sexta: 'Sexta', sabado: 'Sábado', domingo: 'Domingo',
}

function TrainingCard({ training, action }: { training: Training; action: React.ReactNode }) {
  return (
    <div className="training-card">
      <p className="training-card__title">{training.modality}</p>
      <p className="training-card__detail">
        {(training.weekdays ?? []).map(d => WEEKDAY_LABEL[d] ?? d).join(', ')} · {training.hour}
      </p>
      <p className="training-card__detail">{training.address}</p>
      {training.description && <p className="training-card__detail">{training.description}</p>}
      <p className="training-card__detail">Vagas: {training.maxStudents}</p>
      <div className="training-card__actions">{action}</div>
    </div>
  )
}

function StudentDashboard() {
  const [tab, setTab] = useState<Tab>('matricula')
  const [available, setAvailable] = useState<Training[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loadingAvailable, setLoadingAvailable] = useState(true)
  const [loadingEnrolled, setLoadingEnrolled] = useState(true)
  const [enrollingId, setEnrollingId] = useState<number | null>(null)
  const [confirmUnenrollId, setConfirmUnenrollId] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [errorAvailable, setErrorAvailable] = useState('')
  const [errorEnrolled, setErrorEnrolled] = useState('')
  const { signOut, userId } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    getTrainings()
      .then(setAvailable)
      .catch(() => setErrorAvailable('Não foi possível carregar os treinos'))
      .finally(() => setLoadingAvailable(false))
  }, [])

  useEffect(() => {
    getMyEnrollments()
      .then(setEnrollments)
      .catch(() => setErrorEnrolled('Não foi possível carregar suas matrículas'))
      .finally(() => setLoadingEnrolled(false))
  }, [])

  async function handleEnroll(trainingId: number) {
    if (!userId) return
    setEnrollingId(trainingId)
    try {
      const enrollment = await enrollInTraining(trainingId, userId)
      setEnrollments(prev => [...prev, enrollment])
    } catch {
      // silently ignore
    } finally {
      setEnrollingId(null)
    }
  }

  async function handleUnenroll() {
    if (confirmUnenrollId === null) return
    const id = confirmUnenrollId
    setConfirmUnenrollId(null)
    setTogglingId(id)
    try {
      await updateEnrollment(id, { active: false })
      setEnrollments(prev => prev.map(e => e.id === id ? { ...e, active: false } : e))
    } catch {
      // silently ignore
    } finally {
      setTogglingId(null)
    }
  }

  async function handleReenroll(enrollmentId: number) {
    setTogglingId(enrollmentId)
    try {
      await updateEnrollment(enrollmentId, { active: true })
      setEnrollments(prev => prev.map(e => e.id === enrollmentId ? { ...e, active: true } : e))
      setTab('meus-treinos')
    } catch {
      // silently ignore
    } finally {
      setTogglingId(null)
    }
  }

  function handleLogout() {
    logout()
    signOut()
    navigate('/')
  }

  const myEnrollments = userId ? enrollments.filter(e => e.user?.id === userId) : []
  const activeEnrollments = myEnrollments.filter(e => e.active)
  const cancelledEnrollments = myEnrollments.filter(e => !e.active)
  const enrolledTrainingIds = new Set(activeEnrollments.map(e => e.training.id))

  return (
    <div className="student-page">
      <header className="student-header">
        <span className="student-header__brand">CodeSync</span>
        <nav className="student-nav">
          <button
            className={`student-nav__tab${tab === 'matricula' ? ' student-nav__tab--active' : ''}`}
            onClick={() => setTab('matricula')}
          >
            Matrícula de Treino
          </button>
          <button
            className={`student-nav__tab${tab === 'meus-treinos' ? ' student-nav__tab--active' : ''}`}
            onClick={() => setTab('meus-treinos')}
          >
            Meus Treinos
          </button>
          <button
            className={`student-nav__tab${tab === 'cancelados' ? ' student-nav__tab--active' : ''}`}
            onClick={() => setTab('cancelados')}
          >
            Cancelados
            {cancelledEnrollments.length > 0 && (
              <span className="tab-badge">{cancelledEnrollments.length}</span>
            )}
          </button>
        </nav>
        <button className="student-header__logout" onClick={handleLogout}>Sair</button>
      </header>

      <main className="student-content">
        {tab === 'matricula' && (
          <>
            <h2 className="section-title">Treinos Disponíveis</h2>
            {loadingAvailable && <p className="empty-state">Carregando...</p>}
            {errorAvailable && <p className="empty-state error">{errorAvailable}</p>}
            {!loadingAvailable && !errorAvailable && available.length === 0 && (
              <p className="empty-state">Nenhum treino disponível no momento.</p>
            )}
            <div className="training-grid">
              {available.map(t => (
                <TrainingCard
                  key={t.id}
                  training={t}
                  action={
                    enrolledTrainingIds.has(t.id) ? (
                      <span className="enrolled-badge">Matriculado</span>
                    ) : (
                      <button
                        className="enroll-btn"
                        disabled={enrollingId === t.id || !userId}
                        onClick={() => handleEnroll(t.id)}
                      >
                        {enrollingId === t.id ? 'Aguarde...' : 'Matricular-se'}
                      </button>
                    )
                  }
                />
              ))}
            </div>
          </>
        )}

        {tab === 'meus-treinos' && (
          <>
            <h2 className="section-title">Meus Treinos</h2>
            {loadingEnrolled && <p className="empty-state">Carregando...</p>}
            {errorEnrolled && <p className="empty-state error">{errorEnrolled}</p>}
            {!loadingEnrolled && !errorEnrolled && activeEnrollments.length === 0 && (
              <p className="empty-state">Você ainda não está matriculado em nenhum treino.</p>
            )}
            <div className="training-grid">
              {activeEnrollments.map(e => (
                <TrainingCard
                  key={e.id}
                  training={e.training}
                  action={
                    <button
                      className="unenroll-btn"
                      disabled={togglingId === e.id}
                      onClick={() => setConfirmUnenrollId(e.id)}
                    >
                      {togglingId === e.id ? 'Aguarde...' : 'Cancelar matrícula'}
                    </button>
                  }
                />
              ))}
            </div>
          </>
        )}

        {tab === 'cancelados' && (
          <>
            <h2 className="section-title">Matrículas Canceladas</h2>
            {loadingEnrolled && <p className="empty-state">Carregando...</p>}
            {!loadingEnrolled && cancelledEnrollments.length === 0 && (
              <p className="empty-state">Nenhuma matrícula cancelada.</p>
            )}
            <div className="training-grid">
              {cancelledEnrollments.map(e => (
                <TrainingCard
                  key={e.id}
                  training={e.training}
                  action={
                    <button
                      className="reenroll-btn"
                      disabled={togglingId === e.id}
                      onClick={() => handleReenroll(e.id)}
                    >
                      {togglingId === e.id ? 'Aguarde...' : 'Rematricular-se'}
                    </button>
                  }
                />
              ))}
            </div>
          </>
        )}
      </main>

      {confirmUnenrollId !== null && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <p className="confirm-dialog__text">Tem certeza que deseja cancelar sua matrícula? Você poderá rematricular depois na aba Cancelados.</p>
            <div className="confirm-dialog__actions">
              <button className="confirm-btn confirm-btn--cancel" onClick={() => setConfirmUnenrollId(null)}>
                Voltar
              </button>
              <button className="confirm-btn confirm-btn--danger" onClick={handleUnenroll}>
                Cancelar matrícula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentDashboard
