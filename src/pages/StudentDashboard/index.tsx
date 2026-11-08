import { useState, useEffect } from 'react'
import './style.css'
import NotificationBell from '../../components/NotificationBell'
import { useAuth } from '../../contexts/AuthContext'
import { logout } from '../../services/auth.service'
import { getTrainings, enrollInTraining, getMyEnrollments, updateEnrollment } from '../../services/training.service'
import { getEvents } from '../../services/event.service'
import { getAllEventRegistrations, registerInEvent, updateEventRegistration } from '../../services/eventRegistration.service'
import { syncStravaActivities } from '../../services/strava.service'
import StravaConnect from '../../components/StravaConnect'
import AthletePerformanceView from '../../components/AthletePerformanceView'
import { getMyAttendances } from '../../services/attendance.service'
import AttendanceSessions from '../../components/AttendanceSessions'
import { LEVEL_LABELS, type Attendance, type Training, type Enrollment, type Event, type EventRegistration } from '../../types'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useNotifications } from '../../contexts/NotificationContext'

type Tab = 'matricula' | 'meus-treinos' | 'cancelados' | 'eventos' | 'strava'

const WEEKDAY_LABEL: Record<string, string> = {
  segunda: 'Segunda', terca: 'Terça', quarta: 'Quarta',
  quinta: 'Quinta', sexta: 'Sexta', sabado: 'Sábado', domingo: 'Domingo',
}

function TrainingCard({ training, action, children }: { training: Training; action: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="training-card">
      <div className="training-card__heading">
        <p className="training-card__title">{training.modality}</p>
        {training.level && <span className="level-badge">{LEVEL_LABELS[training.level] ?? training.level}</span>}
      </div>
      <p className="training-card__detail">
        {(training.weekdays ?? []).map(d => WEEKDAY_LABEL[d] ?? d).join(', ')} · {training.hour}
      </p>
      <p className="training-card__detail">
        {training.address}{training.campus && ` · ${training.campus}`}
      </p>
      {training.professor && <p className="training-card__detail">Professor: {training.professor.name}</p>}
      {training.description && <p className="training-card__detail">{training.description}</p>}
      <p className="training-card__detail">Vagas: {training.maxStudents}</p>
      <div className="training-card__actions">{action}</div>
      {children}
    </div>
  )
}

function EventCard({ event, action }: { event: Event; action: React.ReactNode }) {
  return (
    <div className="training-card">
      {event.image && (
        <img className="event-card__image" src={event.image} alt={event.title} />
      )}
      <p className="training-card__title">{event.title}</p>
      {event.date && (
        <p className="training-card__detail">
          {new Date(event.date).toLocaleDateString('pt-BR', { dateStyle: 'long' })}
        </p>
      )}
      <p className="training-card__detail">{event.description}</p>
      <div className="training-card__actions">{action}</div>
    </div>
  )
}

function StudentDashboard() {
  const [tab, setTab] = useState<Tab>('matricula')
  const [available, setAvailable] = useState<Training[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [eventRegs, setEventRegs] = useState<EventRegistration[]>([])
  const [myAttendances, setMyAttendances] = useState<Attendance[]>([])
  const [loadingAvailable, setLoadingAvailable] = useState(true)
  const [loadingEnrolled, setLoadingEnrolled] = useState(true)
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [syncingStrava, setSyncingStrava] = useState(false)
  const [syncError, setSyncError] = useState('')
  const [stravaConnected, setStravaConnected] = useState(false)
  const [performanceVersion, setPerformanceVersion] = useState(0)
  const [searchParams, setSearchParams] = useSearchParams()
  const { latest } = useNotifications()

  // Link das notificações de desempenho: /dashboard/atleta?tab=desempenho
  useEffect(() => {
    if (searchParams.get('tab') !== 'desempenho') return
    setTab('strava')
    setPerformanceVersion(v => v + 1)
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  // Professor registrou desempenho: atualiza o painel em tempo real.
  useEffect(() => {
    if (latest?.type === 'performance_recorded') setPerformanceVersion(v => v + 1)
  }, [latest])
  const [enrollingId, setEnrollingId] = useState<number | null>(null)
  const [confirmUnenrollId, setConfirmUnenrollId] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [registeringEventId, setRegisteringEventId] = useState<number | null>(null)
  const [errorAvailable, setErrorAvailable] = useState('')
  const [errorEnrolled, setErrorEnrolled] = useState('')
  const [modalityFilter, setModalityFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
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

  useEffect(() => {
    getMyAttendances().then(setMyAttendances).catch(() => setMyAttendances([]))
  }, [])

  useEffect(() => {
    Promise.all([getEvents(), getAllEventRegistrations()])
      .then(([evts, regs]) => {
        setEvents(evts)
        setEventRegs(regs)
      })
      .finally(() => setLoadingEvents(false))
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

  async function handleEventRegister(eventId: number) {
    if (!userId) return
    setRegisteringEventId(eventId)
    try {
      const reg = await registerInEvent(eventId, userId)
      setEventRegs(prev => [...prev, reg])
    } catch {
      // silently ignore
    } finally {
      setRegisteringEventId(null)
    }
  }

  async function handleEventCancel(regId: number) {
    setRegisteringEventId(regId)
    try {
      await updateEventRegistration(regId, { active: false })
      setEventRegs(prev => prev.map(r => r.id === regId ? { ...r, active: false } : r))
    } catch {
      // silently ignore
    } finally {
      setRegisteringEventId(null)
    }
  }

  async function handleSyncStrava() {
    setSyncingStrava(true)
    setSyncError('')
    try {
      await syncStravaActivities()
      setPerformanceVersion(v => v + 1)
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Não foi possível sincronizar com o Strava')
    } finally {
      setSyncingStrava(false)
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

  const modalities = [...new Set(available.map(t => t.modality))].sort()
  const filteredAvailable = available.filter(t =>
    t.active !== false &&
    (!modalityFilter || t.modality === modalityFilter) &&
    (!levelFilter || t.level === levelFilter),
  )

  const myEventRegs = userId ? eventRegs.filter(r => r.user?.id === userId) : []
  const activeEventRegIds = new Set(myEventRegs.filter(r => r.active).map(r => r.event.id))

  return (
    <div className="student-page">
      <header className="student-header">
        <span className="student-header__brand">CoreSync</span>
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
          <button
            className={`student-nav__tab${tab === 'eventos' ? ' student-nav__tab--active' : ''}`}
            onClick={() => setTab('eventos')}
          >
            Eventos
          </button>
          <button
            className={`student-nav__tab${tab === 'strava' ? ' student-nav__tab--active' : ''}`}
            onClick={() => setTab('strava')}
          >
            Desempenho
          </button>
        </nav>
        <button className="student-header__profile" onClick={() => navigate('/agenda')}>Agenda</button>
        <NotificationBell />
        <button className="student-header__profile" onClick={() => navigate('/perfil')}>Perfil</button>
        <button className="student-header__logout" onClick={handleLogout}>Sair</button>
      </header>

      <main className="student-content">
        {tab === 'matricula' && (
          <>
            <h2 className="section-title">Treinos Disponíveis</h2>
            <div className="filter-bar">
              <select className="filter-bar__select" value={modalityFilter} onChange={e => setModalityFilter(e.target.value)}>
                <option value="">Todas as modalidades</option>
                {modalities.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select className="filter-bar__select" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
                <option value="">Todos os níveis</option>
                {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            {loadingAvailable && <p className="empty-state">Carregando...</p>}
            {errorAvailable && <p className="empty-state error">{errorAvailable}</p>}
            {!loadingAvailable && !errorAvailable && filteredAvailable.length === 0 && (
              <p className="empty-state">Nenhum treino disponível no momento.</p>
            )}
            <div className="training-grid">
              {filteredAvailable.map(t => (
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
                >
                  <AttendanceSessions
                    training={e.training}
                    mine={myAttendances.filter(a => a.training?.id === e.training.id)}
                    onConfirmed={a => setMyAttendances(prev => [a, ...prev])}
                    onCancelled={id => setMyAttendances(prev => prev.filter(a => a.id !== id))}
                  />
                </TrainingCard>
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

        {tab === 'eventos' && (
          <>
            <h2 className="section-title">Eventos Disponíveis</h2>
            {loadingEvents && <p className="empty-state">Carregando...</p>}
            {!loadingEvents && events.length === 0 && (
              <p className="empty-state">Nenhum evento disponível no momento.</p>
            )}
            <div className="training-grid">
              {events.map(event => {
                const myReg = myEventRegs.find(r => r.event.id === event.id)
                const isActive = activeEventRegIds.has(event.id)
                return (
                  <EventCard
                    key={event.id}
                    event={event}
                    action={
                      <div className="event-card-actions">
                        <button
                          className="event-detail-link"
                          onClick={() => navigate(`/evento/${event.id}`)}
                        >
                          Ver detalhes
                        </button>
                        {isActive ? (
                          <span className="enrolled-badge">Inscrito</span>
                        ) : (
                          <button
                            className="enroll-btn"
                            disabled={registeringEventId === event.id || !userId}
                            onClick={() => handleEventRegister(event.id)}
                          >
                            {registeringEventId === event.id ? 'Aguarde...' : 'Inscrever-se'}
                          </button>
                        )}
                        {isActive && myReg && (
                          <button
                            className="unenroll-btn"
                            disabled={registeringEventId === myReg.id}
                            onClick={() => handleEventCancel(myReg.id)}
                          >
                            {registeringEventId === myReg.id ? 'Aguarde...' : 'Cancelar inscrição'}
                          </button>
                        )}
                      </div>
                    }
                  />
                )
              })}
            </div>
          </>
        )}

        {tab === 'strava' && (
          <>
            <div className="strava-header">
              <h2 className="section-title">Meu Desempenho</h2>
              {stravaConnected && (
                <button className="sync-btn" disabled={syncingStrava} onClick={handleSyncStrava}>
                  {syncingStrava ? 'Sincronizando...' : 'Sincronizar Strava'}
                </button>
              )}
            </div>
            <StravaConnect onStatusChange={s => setStravaConnected(s.connected)} />
            {syncError && <p className="empty-state error">{syncError}</p>}
            {userId && <AthletePerformanceView key={performanceVersion} athleteId={userId} shareable />}
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
