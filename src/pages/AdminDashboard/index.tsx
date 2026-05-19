import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './style.css'
import { useAuth } from '../../contexts/AuthContext'
import { logout } from '../../services/auth.service'
import { getUsers, deleteUser, updateUser } from '../../services/user.service'
import { getTrainings, deleteTraining } from '../../services/training.service'
import { getEvents, deleteEvent } from '../../services/event.service'
import type { User, Training, Event } from '../../types'

type Tab = 'professores' | 'atletas' | 'treinos' | 'eventos'

function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('professores')
  const [users, setUsers] = useState<User[]>([])
  const [trainings, setTrainings] = useState<Training[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<number | null>(null)
  const [confirmDeleteTraining, setConfirmDeleteTraining] = useState<number | null>(null)
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<number | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editName, setEditName] = useState('')
  const [editTelephone, setEditTelephone] = useState('')
  const { signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getUsers(), getTrainings(), getEvents()])
      .then(([u, t, e]) => {
        setUsers(u)
        setTrainings(t)
        setEvents(e)
      })
      .catch(() => setError('Não foi possível carregar os dados'))
      .finally(() => setLoading(false))
  }, [])

  function handleLogout() {
    logout()
    signOut()
    navigate('/')
  }

  async function handleDeleteUser() {
    if (confirmDeleteUser === null) return
    try {
      await deleteUser(confirmDeleteUser)
      setUsers(prev => prev.filter(u => u.id !== confirmDeleteUser))
    } catch {
      setError('Não foi possível remover o usuário')
    } finally {
      setConfirmDeleteUser(null)
    }
  }

  async function handleDeleteTraining() {
    if (confirmDeleteTraining === null) return
    try {
      await deleteTraining(confirmDeleteTraining)
      setTrainings(prev => prev.filter(t => t.id !== confirmDeleteTraining))
    } catch {
      setError('Não foi possível excluir o treino')
    } finally {
      setConfirmDeleteTraining(null)
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

  function openEditUser(user: User) {
    setEditingUser(user)
    setEditName(user.name)
    setEditTelephone(user.telephone)
  }

  async function handleSaveUser() {
    if (!editingUser) return
    try {
      await updateUser(editingUser.id, { name: editName, telephone: editTelephone })
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, name: editName, telephone: editTelephone } : u))
      setEditingUser(null)
    } catch {
      setError('Não foi possível atualizar o usuário')
    }
  }

  const professors = users.filter(u => u.userType === 'professor')
  const athletes = users.filter(u => u.userType === 'aluno')

  const WEEKDAY_LABEL: Record<string, string> = {
    segunda: 'Segunda', terca: 'Terça', quarta: 'Quarta',
    quinta: 'Quinta', sexta: 'Sexta', sabado: 'Sábado', domingo: 'Domingo',
  }

  function renderUserList(list: User[]) {
    if (loading) return <p className="empty-state">Carregando...</p>
    if (list.length === 0) return <p className="empty-state">Nenhum usuário encontrado.</p>
    return (
      <div className="admin-user-list">
        {list.map(u => (
          <div key={u.id} className="admin-user-row">
            <span className="admin-user-avatar">{u.name[0].toUpperCase()}</span>
            <div className="admin-user-info">
              <span className="admin-user-name">{u.name}</span>
              <span className="admin-user-meta">{u.email} · {u.telephone}</span>
            </div>
            <div className="admin-user-actions">
              <button className="row-btn row-btn--edit" onClick={() => openEditUser(u)}>Editar</button>
              <button className="row-btn row-btn--delete" onClick={() => setConfirmDeleteUser(u.id)}>Remover</button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <span className="admin-header__brand">CoreSync</span>
        <nav className="admin-nav">
          {(['professores', 'atletas', 'treinos', 'eventos'] as Tab[]).map(t => (
            <button
              key={t}
              className={`admin-nav__tab${tab === t ? ' admin-nav__tab--active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
        <div className="admin-header__actions">
          {tab === 'treinos' && (
            <button className="admin-header__create" onClick={() => navigate('/criar-treino')}>+ Treino</button>
          )}
          {tab === 'eventos' && (
            <button className="admin-header__create" onClick={() => navigate('/criar-evento')}>+ Evento</button>
          )}
        </div>
        <button className="admin-header__logout" onClick={handleLogout}>Sair</button>
      </header>

      <main className="admin-content">
        {error && <p className="empty-state error">{error}</p>}

        {tab === 'professores' && (
          <>
            <h2 className="section-title">Professores</h2>
            {renderUserList(professors)}
          </>
        )}

        {tab === 'atletas' && (
          <>
            <h2 className="section-title">Atletas</h2>
            {renderUserList(athletes)}
          </>
        )}

        {tab === 'treinos' && (
          <>
            <h2 className="section-title">Treinos Cadastrados</h2>
            {loading && <p className="empty-state">Carregando...</p>}
            {!loading && trainings.length === 0 && <p className="empty-state">Nenhum treino cadastrado.</p>}
            <div className="admin-list">
              {trainings.map(t => (
                <div key={t.id} className="admin-row">
                  <div className="admin-row__info">
                    <span className="admin-row__name">{t.modality}</span>
                    <span className="admin-row__meta">
                      {(t.weekdays ?? []).map(d => WEEKDAY_LABEL[d] ?? d).join(', ')} · {t.hour} · {t.address}
                    </span>
                  </div>
                  <span className="admin-row__badge">{t.maxStudents} vagas</span>
                  <div className="admin-row__actions">
                    <button className="row-btn row-btn--edit" onClick={() => navigate(`/editar-treino/${t.id}`)}>Editar</button>
                    <button className="row-btn row-btn--delete" onClick={() => setConfirmDeleteTraining(t.id)}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'eventos' && (
          <>
            <h2 className="section-title">Eventos</h2>
            {loading && <p className="empty-state">Carregando...</p>}
            {!loading && events.length === 0 && <p className="empty-state">Nenhum evento cadastrado.</p>}
            <div className="admin-list">
              {events.map(e => (
                <div key={e.id} className="admin-row">
                  <div className="admin-row__info">
                    <span className="admin-row__name">{e.title}</span>
                    <span className="admin-row__meta">
                      {e.date ? new Date(e.date).toLocaleDateString('pt-BR') : 'Sem data'} · {e.description}
                    </span>
                  </div>
                  {e.tournamentBracket && (
                    <span className="admin-row__badge">Bracket: {e.tournamentBracket.type}</span>
                  )}
                  <div className="admin-row__actions">
                    <button className="row-btn row-btn--edit" onClick={() => navigate(`/editar-evento/${e.id}`)}>Editar</button>
                    <button className="row-btn row-btn--delete" onClick={() => setConfirmDeleteEvent(e.id)}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {confirmDeleteUser !== null && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <p className="confirm-dialog__text">Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.</p>
            <div className="confirm-dialog__actions">
              <button className="confirm-btn confirm-btn--cancel" onClick={() => setConfirmDeleteUser(null)}>Cancelar</button>
              <button className="confirm-btn confirm-btn--danger" onClick={handleDeleteUser}>Remover</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteTraining !== null && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <p className="confirm-dialog__text">Tem certeza que deseja excluir este treino? Todas as matrículas serão perdidas.</p>
            <div className="confirm-dialog__actions">
              <button className="confirm-btn confirm-btn--cancel" onClick={() => setConfirmDeleteTraining(null)}>Cancelar</button>
              <button className="confirm-btn confirm-btn--danger" onClick={handleDeleteTraining}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteEvent !== null && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <p className="confirm-dialog__text">Tem certeza que deseja excluir este evento?</p>
            <div className="confirm-dialog__actions">
              <button className="confirm-btn confirm-btn--cancel" onClick={() => setConfirmDeleteEvent(null)}>Cancelar</button>
              <button className="confirm-btn confirm-btn--danger" onClick={handleDeleteEvent}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {editingUser !== null && (
        <div className="confirm-overlay">
          <div className="confirm-dialog confirm-dialog--form">
            <p className="confirm-dialog__title">Editar Usuário</p>
            <div className="edit-form">
              <label className="edit-form__label">Nome</label>
              <input
                className="edit-form__input"
                value={editName}
                onChange={e => setEditName(e.target.value)}
              />
              <label className="edit-form__label">Telefone</label>
              <input
                className="edit-form__input"
                value={editTelephone}
                onChange={e => setEditTelephone(e.target.value)}
              />
            </div>
            <div className="confirm-dialog__actions">
              <button className="confirm-btn confirm-btn--cancel" onClick={() => setEditingUser(null)}>Cancelar</button>
              <button className="confirm-btn confirm-btn--confirm" onClick={handleSaveUser}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
