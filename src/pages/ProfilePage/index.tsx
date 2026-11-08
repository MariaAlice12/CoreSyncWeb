import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './style.css'
import { useAuth } from '../../contexts/auth'
import { getUserById, updateUser } from '../../services/user.service'
import StravaConnect from '../../components/StravaConnect'
import { SHIFT_LABELS, type Shift, type User } from '../../types'

// Retorno do OAuth do Strava (?strava=...)
const STRAVA_FEEDBACK: Record<string, { ok: boolean; text: string }> = {
  connected: { ok: true, text: 'Conta do Strava conectada! Sincronize suas atividades na aba Desempenho.' },
  denied: { ok: false, text: 'A conexão com o Strava foi cancelada.' },
  error: { ok: false, text: 'Não foi possível conectar ao Strava. Tente novamente.' },
}

function ProfilePage() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const stravaFeedback = STRAVA_FEEDBACK[searchParams.get('strava') ?? '']
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [name, setName] = useState('')
  const [telephone, setTelephone] = useState('')
  const [password, setPassword] = useState('')
  const [course, setCourse] = useState('')
  const [shift, setShift] = useState('')
  const [campus, setCampus] = useState('')

  useEffect(() => {
    if (!userId) return
    getUserById(userId)
      .then(u => {
        setUser(u)
        setName(u.name)
        setTelephone(u.telephone)
        setCourse(u.course ?? '')
        setShift(u.shift ?? '')
        setCampus(u.campus ?? '')
      })
      .catch(() => setError('Não foi possível carregar o perfil'))
      .finally(() => setLoading(false))
  }, [userId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const isAthlete = user?.userType === 'aluno'
      const payload: Record<string, string> = { name, telephone, campus }
      if (isAthlete) Object.assign(payload, { course, ...(shift ? { shift } : {}) })
      if (password) payload.password = password
      await updateUser(userId, payload)
      setSuccess('Perfil atualizado com sucesso!')
      setPassword('')
      if (user) {
        setUser({
          ...user, name, telephone, campus,
          ...(isAthlete ? { course, shift: (shift || null) as Shift | null } : {}),
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <p className="empty-state">Carregando...</p>
        </div>
      </div>
    )
  }

  const ROLE_LABEL: Record<string, string> = { aluno: 'Atleta', professor: 'Professor', admin: 'Administrador' }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <button className="back-btn" onClick={() => navigate(-1)}>← Voltar</button>

        <div className="profile-header">
          <div className="profile-avatar">{user?.name[0].toUpperCase()}</div>
          <div>
            <h1 className="profile-name">{user?.name}</h1>
            <span className="profile-role">{ROLE_LABEL[user?.userType ?? ''] ?? user?.userType}</span>
          </div>
        </div>

        {stravaFeedback && (
          <p className={stravaFeedback.ok ? 'form-success' : 'form-error'}>{stravaFeedback.text}</p>
        )}

        {user?.userType === 'aluno' && <StravaConnect />}

        <form className="profile-form" onSubmit={handleSubmit}>
          <h2 className="profile-form__title">Editar Perfil</h2>

          <div className="profile-field">
            <label className="profile-field__label">Nome</label>
            <input
              className="profile-field__input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="profile-field">
            <label className="profile-field__label">Email</label>
            <input
              className="profile-field__input profile-field__input--readonly"
              type="email"
              value={user?.email ?? ''}
              readOnly
            />
          </div>

          <div className="profile-field">
            <label className="profile-field__label">Telefone</label>
            <input
              className="profile-field__input"
              type="tel"
              value={telephone}
              onChange={e => setTelephone(e.target.value)}
            />
          </div>

          {user?.userType === 'aluno' && (
            <>
              <div className="profile-field">
                <label className="profile-field__label">Curso</label>
                <input
                  className="profile-field__input"
                  type="text"
                  value={course}
                  onChange={e => setCourse(e.target.value)}
                />
              </div>

              <div className="profile-field">
                <label className="profile-field__label">Turno</label>
                <select
                  className="profile-field__input"
                  value={shift}
                  onChange={e => setShift(e.target.value)}
                >
                  <option value="" disabled>Selecione</option>
                  {Object.entries(SHIFT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="profile-field">
            <label className="profile-field__label">Campus / unidade</label>
            <input
              className="profile-field__input"
              type="text"
              value={campus}
              onChange={e => setCampus(e.target.value)}
            />
          </div>

          <div className="profile-field">
            <label className="profile-field__label">Nova Senha <span className="profile-field__optional">(deixe em branco para manter)</span></label>
            <input
              className="profile-field__input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}

          <button className="profile-save-btn" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProfilePage
