import { useState, useEffect } from 'react'
import './style.css'
import { useAuth } from '../../contexts/AuthContext'
import { logout } from '../../services/auth.service'
import { getTrainings, enrollInTraining, getMyEnrollments, updateEnrollment } from '../../services/training.service'
import { getEvents } from '../../services/event.service'
import { getAllEventRegistrations, registerInEvent, updateEventRegistration } from '../../services/eventRegistration.service'
import { getStravaActivities, syncStravaActivities } from '../../services/strava.service'
import type { Training, Enrollment, Event, EventRegistration, StravaActivity } from '../../types'
import { useNavigate } from 'react-router-dom'

type Tab = 'matricula' | 'meus-treinos' | 'cancelados' | 'eventos' | 'strava'

const WEEKDAY_LABEL: Record<string, string> = {
  segunda: 'Segunda', terca: 'Terça', quarta: 'Quarta',
  quinta: 'Quinta', sexta: 'Sexta', sabado: 'Sábado', domingo: 'Domingo',
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}min`
  return `${m}min`
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
  const [stravaActivities, setStravaActivities] = useState<StravaActivity[]>([])
  const [loadingAvailable, setLoadingAvailable] = useState(true)
  const [loadingEnrolled, setLoadingEnrolled] = useState(true)
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadingStrava, setLoadingStrava] = useState(false)
  const [syncingStrava, setSyncingStrava] = useState(false)
  const [enrollingId, setEnrollingId] = useState<number | null>(null)
  const [confirmUnenrollId, setConfirmUnenrollId] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [registeringEventId, setRegisteringEventId] = useState<number | null>(null)
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

  useEffect(() => {
    Promise.all([getEvents(), getAllEventRegistrations()])
      .then(([evts, regs]) => {
        setEvents(evts)
        setEventRegs(regs)
      })
      .finally(() => setLoadingEvents(false))
  }, [])

  useEffect(() => {
    if (tab !== 'strava' || stravaActivities.length > 0) return
    setLoadingStrava(true)
    getStravaActivities()
      .then(setStravaActivities)
      .finally(() => setLoadingStrava(false))
  }, [tab])

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
    try {
      const activities = await syncStravaActivities()
      setStravaActivities(activities)
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
            Strava
          </button>
        </nav>
        <button className="student-header__profile" onClick={() => navigate('/perfil')}>Perfil</button>
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
              <h2 className="section-title">Atividades Strava</h2>
              <button className="sync-btn" disabled={syncingStrava} onClick={handleSyncStrava}>
                {syncingStrava ? 'Sincronizando...' : 'Sincronizar'}
              </button>
            </div>
            {loadingStrava && <p className="empty-state">Carregando...</p>}
            {!loadingStrava && stravaActivities.length === 0 && (
              <p className="empty-state">Nenhuma atividade encontrada. Clique em Sincronizar para buscar do Strava.</p>
            )}
            <div className="strava-list">
              {stravaActivities.map(a => (
                <div key={a.id} className="strava-card">
                  <div className="strava-card__header">
                    <span className="strava-card__name">{a.name}</span>
                    <span className="strava-card__type">{a.sportType ?? a.type}</span>
                  </div>
                  <div className="strava-card__stats">
                    <div className="strava-stat">
                      <span className="strava-stat__value">{(a.distance / 1000).toFixed(2)}</span>
                      <span className="strava-stat__label">km</span>
                    </div>
                    <div className="strava-stat">
                      <span className="strava-stat__value">{formatSeconds(a.movingTime)}</span>
                      <span className="strava-stat__label">tempo</span>
                    </div>
                    {a.averageSpeed && (
                      <div className="strava-stat">
                        <span className="strava-stat__value">{(a.averageSpeed * 3.6).toFixed(1)}</span>
                        <span className="strava-stat__label">km/h</span>
                      </div>
                    )}
                    <div className="strava-stat">
                      <span className="strava-stat__value">{a.totalElevationGain.toFixed(0)}</span>
                      <span className="strava-stat__label">m ganho</span>
                    </div>
                  </div>
                  <span className="strava-card__date">
                    {new Date(a.startDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
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
