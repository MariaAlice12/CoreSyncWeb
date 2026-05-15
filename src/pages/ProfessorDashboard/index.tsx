import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './style.css'
import { useAuth } from '../../contexts/AuthContext'
import { logout } from '../../services/auth.service'
import { getTrainings, getAllEnrollments, deleteTraining, removeEnrollment } from '../../services/training.service'
import type { Training, Enrollment } from '../../types'

type Tab = 'treinos' | 'alunos'

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
  const [loadingTrainings, setLoadingTrainings] = useState(true)
  const [loadingEnrollments, setLoadingEnrollments] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmEnrollmentId, setConfirmEnrollmentId] = useState<number | null>(null)
  const [deletingEnrollmentId, setDeletingEnrollmentId] = useState<number | null>(null)
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

  const enrollmentsByTraining = enrollments.reduce<Record<number, Enrollment[]>>((acc, e) => {
    const id = e.training.id
    if (!acc[id]) acc[id] = []
    acc[id].push(e)
    return acc
  }, {})

  return (
    <div className="professor-page">
      <header className="professor-header">
        <span className="professor-header__brand">CodeSync</span>
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
        </nav>
        <button className="professor-header__create" onClick={() => navigate('/criar-treino')}>
          + Criar Treino
        </button>
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
    </div>
  )
}

export default ProfessorDashboard
