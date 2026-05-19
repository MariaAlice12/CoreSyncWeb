import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './style.css'
import { useAuth } from '../../contexts/AuthContext'
import { logout } from '../../services/auth.service'
import { getTrainings, getAllEnrollments, deleteTraining, removeEnrollment } from '../../services/training.service'
import { getEvents, deleteEvent } from '../../services/event.service'
import { getAllEventRegistrations, removeEventRegistration } from '../../services/eventRegistration.service'
import type { Training, Enrollment, Event, EventRegistration } from '../../types'
import BracketVisual from '../../components/BracketVisual'

type Tab = 'treinos' | 'alunos' | 'eventos'

const WEEKDAY_LABEL: Record<string, string> = {
  segunda: 'Segunda', terca: 'Terça', quarta: 'Quarta',
  quinta: 'Quinta', sexta: 'Sexta', sabado: 'Sábado', domingo: 'Domingo',
}

function formatWeekdays(weekdays: string[]): string {
  return (weekdays ?? []).map(d => WEEKDAY_LABEL[d] ?? d).join(', ')
}

function ProfessorDashboard() {
  const [tab, setTab] = useState<Tab>('treinos')
  const [trainings, setTrainings] = useState<Training[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [eventRegs, setEventRegs] = useState<EventRegistration[]>([])
  const [loadingTrainings, setLoadingTrainings] = useState(true)
  const [loadingEnrollments, setLoadingEnrollments] = useState(true)
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmEnrollmentId, setConfirmEnrollmentId] = useState<number | null>(null)
  const [deletingEnrollmentId, setDeletingEnrollmentId] = useState<number | null>(null)
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<number | null>(null)
  const [bracketOpenId, setBracketOpenId] = useState<number | null>(null)
  const { signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    getTrainings()
      .then(setTrainings)
      .catch(() => setError('Não foi possível carregar os treinos'))
      .finally(() => setLoadingTrainings(false))

    getAllEnrollments()
      .then(setEnrollments)
      .catch(() => setError('Não foi possível carregar as matrículas'))
      .finally(() => setLoadingEnrollments(false))

    Promise.all([getEvents(), getAllEventRegistrations()])
      .then(([evts, regs]) => {
        setEvents(evts)
        setEventRegs(regs)
      })
      .finally(() => setLoadingEvents(false))
  }, [])

  function handleLogout() {
    logout()
    signOut()
    navigate('/')
  }

  async function handleDelete() {
    if (deletingId === null) return
    try {
      await deleteTraining(deletingId)
      setTrainings(prev => prev.filter(t => t.id !== deletingId))
      setEnrollments(prev => prev.filter(e => e.training.id !== deletingId))
    } catch {
      setError('Não foi possível excluir o treino')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleRemoveEnrollment() {
    if (confirmEnrollmentId === null) return
    setDeletingEnrollmentId(confirmEnrollmentId)
    setConfirmEnrollmentId(null)
    try {
      await removeEnrollment(confirmEnrollmentId)
      setEnrollments(prev => prev.filter(e => e.id !== confirmEnrollmentId))
    } catch {
      setError('Não foi possível remover a matrícula')
    } finally {
      setDeletingEnrollmentId(null)
    }
  }

  async function handleDeleteEvent() {
    if (confirmDeleteEvent === null) return
    try {
      await deleteEvent(confirmDeleteEvent)
      setEvents(prev => prev.filter(e => e.id !== confirmDeleteEvent))
    } catch {
      setError('Não foi possível excluir o evento')
    } finally {
      setConfirmDeleteEvent(null)
    }
  }

  const enrollmentsByTraining = enrollments.reduce<Record<number, Enrollment[]>>((acc, e) => {
    const id = e.training.id
    if (!acc[id]) acc[id] = []
    acc[id].push(e)
    return acc
  }, {})

  const regsByEvent = eventRegs.reduce<Record<number, EventRegistration[]>>((acc, r) => {
    const id = r.event.id
    if (!acc[id]) acc[id] = []
    acc[id].push(r)
    return acc
  }, {})

  return (
    <div className="professor-page">
      <header className="professor-header">
        <span className="professor-header__brand">CoreSync</span>
        <nav className="professor-nav">
          <button
            className={`professor-nav__tab${tab === 'treinos' ? ' professor-nav__tab--active' : ''}`}
            onClick={() => setTab('treinos')}
          >
            Treinos
          </button>
          <button
            className={`professor-nav__tab${tab === 'alunos' ? ' professor-nav__tab--active' : ''}`}
            onClick={() => setTab('alunos')}
          >
            Alunos
          </button>
          <button
            className={`professor-nav__tab${tab === 'eventos' ? ' professor-nav__tab--active' : ''}`}
            onClick={() => setTab('eventos')}
          >
            Eventos
          </button>
        </nav>
        <div className="professor-header__actions">
          {tab === 'treinos' && (
            <button className="professor-header__create" onClick={() => navigate('/criar-treino')}>
              + Criar Treino
            </button>
          )}
          {tab === 'eventos' && (
            <button className="professor-header__create" onClick={() => navigate('/criar-evento')}>
              + Criar Evento
            </button>
          )}
        </div>
        <button className="professor-header__profile" onClick={() => navigate('/perfil')}>Perfil</button>
        <button className="professor-header__logout" onClick={handleLogout}>Sair</button>
      </header>

      <main className="professor-content">
        {error && <p className="empty-state error">{error}</p>}

        {tab === 'treinos' && (
          <>
            <h2 className="section-title">Treinos Cadastrados</h2>
            {loadingTrainings && <p className="empty-state">Carregando...</p>}
            {!loadingTrainings && !error && trainings.length === 0 && (
              <p className="empty-state">Nenhum treino cadastrado ainda.</p>
            )}
            <div className="training-list">
              {trainings.map(t => (
                <div key={t.id} className="training-row">
                  <div className="training-row__info">
                    <span className="training-row__name">{t.modality}</span>
                    <span className="training-row__meta">
                      {formatWeekdays(t.weekdays)} · {t.hour} · {t.address}
                    </span>
                  </div>
                  <span className="training-row__level">{t.maxStudents} vagas</span>
                  <div className="training-row__actions">
                    <button
                      className="row-btn row-btn--edit"
                      onClick={() => navigate(`/editar-treino/${t.id}`)}
                    >
                      Editar
                    </button>
                    <button
                      className="row-btn row-btn--delete"
                      onClick={() => setDeletingId(t.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'alunos' && (
          <>
            <h2 className="section-title">Alunos por Modalidade</h2>
            {(loadingTrainings || loadingEnrollments) && <p className="empty-state">Carregando...</p>}
            {!loadingTrainings && trainings.length === 0 && (
              <p className="empty-state">Nenhum treino cadastrado ainda.</p>
            )}
            <div className="modality-list">
              {trainings.map(t => {
                const students = enrollmentsByTraining[t.id] ?? []
                return (
                  <div key={t.id} className="modality-card">
                    <div className="modality-card__header">
                      <div className="modality-card__title-group">
                        <span className="modality-card__name">{t.modality}</span>
                        <span className="modality-card__meta">
                          {formatWeekdays(t.weekdays)} · {t.hour} · {t.address}
                        </span>
                      </div>
                      <span className="modality-card__count">
                        {students.length} / {t.maxStudents} alunos
                      </span>
                    </div>

                    {students.length === 0 ? (
                      <p className="modality-card__empty">Nenhum aluno matriculado</p>
                    ) : (
                      <ul className="student-list">
                        {students.map(e => (
                          <li key={e.id} className="student-item">
                            <span className="student-item__avatar">
                              {e.user.name[0].toUpperCase()}
                            </span>
                            <div className="student-item__info">
                              <span className="student-item__name">{e.user.name}</span>
                              <span className="student-item__email">{e.user.email}</span>
                            </div>
                            <button
                              className="student-item__remove"
                              disabled={deletingEnrollmentId === e.id}
                              onClick={() => setConfirmEnrollmentId(e.id)}
                              title="Remover aluno"
                            >
                              {deletingEnrollmentId === e.id ? '...' : '✕'}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {tab === 'eventos' && (
          <>
            <h2 className="section-title">Eventos</h2>
            {loadingEvents && <p className="empty-state">Carregando...</p>}
            {!loadingEvents && events.length === 0 && (
              <p className="empty-state">Nenhum evento cadastrado ainda.</p>
            )}
            <div className="modality-list">
              {events.map(event => {
                const participants = (regsByEvent[event.id] ?? []).filter(r => r.active)
                return (
                  <div key={event.id} className="modality-card">
                    <div className="modality-card__header">
                      <div className="modality-card__title-group">
                        <span className="modality-card__name">{event.title}</span>
                        <span className="modality-card__meta">
                          {event.date ? new Date(event.date).toLocaleDateString('pt-BR') : 'Sem data'} · {event.description}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {event.tournamentBracket && (
                          <span className="training-row__level">Bracket: {event.tournamentBracket.type}</span>
                        )}
                        <span className="modality-card__count">{participants.length} inscritos</span>
                      </div>
                    </div>

                    <div className="modality-card__actions">
                      <button className="row-btn row-btn--edit" onClick={() => navigate(`/editar-evento/${event.id}`)}>Editar</button>
                      <button className="row-btn row-btn--edit" onClick={() => navigate(`/evento/${event.id}`)}>Ver detalhes</button>
                      {event.tournamentBracket && (
                        <button
                          className={`row-btn row-btn--bracket${bracketOpenId === event.id ? ' row-btn--bracket-active' : ''}`}
                          onClick={() => setBracketOpenId(bracketOpenId === event.id ? null : event.id)}
                        >
                          {bracketOpenId === event.id ? 'Ocultar Chave' : 'Mostrar Chave'}
                        </button>
                      )}
                      <button className="row-btn row-btn--delete" onClick={() => setConfirmDeleteEvent(event.id)}>Excluir</button>
                    </div>

                    {event.tournamentBracket && bracketOpenId === event.id && (
                      <div className="event-bracket-inline">
                        <BracketVisual
                          type={event.tournamentBracket.type}
                          teamCount={event.tournamentBracket.teamCount}
                          participants={participants.map(r => r.user.name)}
                        />
                      </div>
                    )}

                    {participants.length === 0 ? (
                      <p className="modality-card__empty">Nenhum participante inscrito</p>
                    ) : (
                      <ul className="student-list">
                        {participants.map(r => (
                          <li key={r.id} className="student-item">
                            <span className="student-item__avatar">{r.user.name[0].toUpperCase()}</span>
                            <div className="student-item__info">
                              <span className="student-item__name">{r.user.name}</span>
                              <span className="student-item__email">{r.user.email}</span>
                            </div>
                            <button
                              className="student-item__remove"
                              onClick={async () => {
                                await removeEventRegistration(r.id)
                                setEventRegs(prev => prev.filter(x => x.id !== r.id))
                              }}
                              title="Remover participante"
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>

      {deletingId !== null && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <p className="confirm-dialog__text">Tem certeza que deseja excluir este treino? Todas as matrículas serão perdidas.</p>
            <div className="confirm-dialog__actions">
              <button className="confirm-btn confirm-btn--cancel" onClick={() => setDeletingId(null)}>
                Cancelar
              </button>
              <button className="confirm-btn confirm-btn--danger" onClick={handleDelete}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmEnrollmentId !== null && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <p className="confirm-dialog__text">Tem certeza que deseja remover este aluno do treino?</p>
            <div className="confirm-dialog__actions">
              <button className="confirm-btn confirm-btn--cancel" onClick={() => setConfirmEnrollmentId(null)}>
                Cancelar
              </button>
              <button className="confirm-btn confirm-btn--danger" onClick={handleRemoveEnrollment}>
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteEvent !== null && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <p className="confirm-dialog__text">Tem certeza que deseja excluir este evento?</p>
            <div className="confirm-dialog__actions">
              <button className="confirm-btn confirm-btn--cancel" onClick={() => setConfirmDeleteEvent(null)}>
                Cancelar
              </button>
              <button className="confirm-btn confirm-btn--danger" onClick={handleDeleteEvent}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfessorDashboard
