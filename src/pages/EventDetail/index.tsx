import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './style.css'
import { getEventById, getEventPhotos, uploadEventPhotos, deleteEventPhoto } from '../../services/event.service'
import { registerInEvent, getEventParticipants, updateEventRegistration } from '../../services/eventRegistration.service'
import { useAuth } from '../../contexts/auth'
import type { Event, EventPhoto, EventRegistration } from '../../types'
import BracketVisual from '../../components/BracketVisual'

function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { userId, userRole } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState('')
  const [showBracket, setShowBracket] = useState(false)
  const [photos, setPhotos] = useState<EventPhoto[]>([])
  const [uploading, setUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [openPhoto, setOpenPhoto] = useState<EventPhoto | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([getEventById(Number(id)), getEventParticipants(Number(id)), getEventPhotos(Number(id))])
      .then(([ev, regs, pics]) => {
        setEvent(ev)
        setRegistrations(regs)
        setPhotos(pics)
      })
      .catch(() => setError('Não foi possível carregar o evento'))
      .finally(() => setLoading(false))
  }, [id])

  const myReg = userId ? registrations.find(r => r.user.id === userId) : undefined

  async function handleRegister() {
    if (!userId || !id) return
    setRegistering(true)
    try {
      const reg = await registerInEvent(Number(id), userId)
      setRegistrations(prev => [...prev, reg])
    } catch {
      setError('Não foi possível realizar a inscrição')
    } finally {
      setRegistering(false)
    }
  }

  async function handleCancelRegistration() {
    if (!myReg) return
    setRegistering(true)
    try {
      await updateEventRegistration(myReg.id, { active: false })
      setRegistrations(prev => prev.map(r => r.id === myReg.id ? { ...r, active: false } : r))
    } catch {
      setError('Não foi possível cancelar a inscrição')
    } finally {
      setRegistering(false)
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0 || !id) return
    setUploading(true)
    setPhotoError('')
    try {
      const added = await uploadEventPhotos(Number(id), Array.from(files))
      setPhotos(prev => [...added, ...prev])
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Não foi possível enviar as fotos')
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function handleDeletePhoto(photo: EventPhoto) {
    if (!id) return
    setPhotoError('')
    try {
      await deleteEventPhoto(Number(id), photo.id)
      setPhotos(prev => prev.filter(p => p.id !== photo.id))
      setOpenPhoto(null)
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Não foi possível remover a foto')
    }
  }

  if (loading) {
    return (
      <div className="event-detail-page">
        <p className="empty-state">Carregando...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="event-detail-page">
        <p className="empty-state error">{error || 'Evento não encontrado'}</p>
        <button className="back-btn" onClick={() => navigate(-1)}>Voltar</button>
      </div>
    )
  }

  const activeRegs = registrations.filter(r => r.active)
  const isManager =
    userRole === 'admin' ||
    event.user?.id === userId ||
    (event.organizers ?? []).some(o => o.id === userId)
  const canUpload = isManager || activeRegs.some(r => r.user.id === userId)
  const canDeletePhoto = (photo: EventPhoto) => isManager || photo.uploadedBy?.id === userId

  return (
    <div className="event-detail-page">
      <div className="event-detail-container">
        <button className="back-btn" onClick={() => navigate(-1)}>← Voltar</button>

        {event.image && (
          <img className="event-detail__image" src={event.image} alt={event.title} />
        )}

        <h1 className="event-detail__title">{event.title}</h1>

        {event.date && (
          <p className="event-detail__date">
            {new Date(event.date).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}
          </p>
        )}

        {event.location && <p className="event-detail__location">📍 {event.location}</p>}

        <p className="event-detail__description">{event.description}</p>

        {(event.user || (event.organizers ?? []).length > 0) && (
          <p className="event-detail__organizers">
            Organização:{' '}
            {[event.user?.name, ...(event.organizers ?? []).map(o => o.name)]
              .filter((n, i, all): n is string => !!n && all.indexOf(n) === i)
              .join(', ')}
          </p>
        )}

        {error && <p className="form-error">{error}</p>}

        {userRole === 'aluno' && (
          <div className="event-detail__action">
            {!myReg || !myReg.active ? (
              <button
                className="event-register-btn"
                disabled={registering}
                onClick={handleRegister}
              >
                {registering ? 'Aguarde...' : 'Inscrever-se no Evento'}
              </button>
            ) : (
              <div className="event-registered">
                <span className="event-registered__badge">Inscrito</span>
                <button
                  className="event-cancel-btn"
                  disabled={registering}
                  onClick={handleCancelRegistration}
                >
                  {registering ? 'Aguarde...' : 'Cancelar inscrição'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="event-detail__participants">
          <h3 className="event-detail__section-title">Participantes ({activeRegs.length})</h3>
          {activeRegs.length === 0 ? (
            <p className="empty-state">Nenhuma inscrição confirmada ainda.</p>
          ) : (
            <ul className="participant-list">
              {activeRegs.map(r => (
                <li key={r.id} className="participant-item">
                  <span className="participant-avatar">{r.user.name[0].toUpperCase()}</span>
                  <span className="participant-name">{r.user.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="event-detail__photos">
          <div className="event-detail__bracket-header">
            <h3 className="event-detail__section-title">Fotos do evento ({photos.length})</h3>
            {canUpload && (
              <>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={e => handleUpload(e.target.files)}
                />
                <button
                  className="bracket-toggle-btn"
                  disabled={uploading}
                  onClick={() => fileInput.current?.click()}
                >
                  {uploading ? 'Enviando...' : '+ Adicionar fotos'}
                </button>
              </>
            )}
          </div>
          {photoError && <p className="form-error">{photoError}</p>}
          {photos.length === 0 ? (
            <p className="empty-state">
              {canUpload ? 'Nenhuma foto ainda. Seja o primeiro a compartilhar!' : 'Nenhuma foto ainda. Inscreva-se para compartilhar as suas.'}
            </p>
          ) : (
            <div className="photo-grid">
              {photos.map(photo => (
                <button key={photo.id} className="photo-grid__item" onClick={() => setOpenPhoto(photo)}>
                  <img src={photo.url} alt={`Foto enviada por ${photo.uploadedBy?.name ?? 'participante'}`} loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {event.tournamentBracket && (
          <div className="event-detail__bracket">
            <div className="event-detail__bracket-header">
              <h3 className="event-detail__section-title">
                Chaveamento · {event.tournamentBracket.name}
                <span className="bracket-type-badge">{event.tournamentBracket.type}</span>
              </h3>
              <button
                className={`bracket-toggle-btn${showBracket ? ' bracket-toggle-btn--active' : ''}`}
                onClick={() => setShowBracket(v => !v)}
              >
                {showBracket ? 'Ocultar Chave' : 'Mostrar Chave'}
              </button>
            </div>
            {showBracket && (
              <BracketVisual
                type={event.tournamentBracket.type}
                teamCount={event.tournamentBracket.teamCount}
                participants={activeRegs.map(r => r.user.name)}
              />
            )}
          </div>
        )}
      </div>

      {openPhoto && (
        <div className="photo-viewer" role="dialog" aria-label="Foto do evento" onClick={() => setOpenPhoto(null)}>
          <div className="photo-viewer__content" onClick={e => e.stopPropagation()}>
            <img src={openPhoto.url} alt="Foto do evento" />
            <div className="photo-viewer__footer">
              <span>
                {openPhoto.uploadedBy?.name ?? 'Participante'} · {new Date(openPhoto.createdAt).toLocaleDateString('pt-BR')}
              </span>
              <div className="photo-viewer__actions">
                <a href={openPhoto.url} target="_blank" rel="noreferrer">Abrir original</a>
                {canDeletePhoto(openPhoto) && (
                  <button onClick={() => handleDeletePhoto(openPhoto)}>Excluir</button>
                )}
                <button onClick={() => setOpenPhoto(null)}>Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventDetail
