import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../CreateTraining/style.css'
import Input from '../../components/Input'
import Button from '../../components/Button'
import OrganizerPicker from '../../components/OrganizerPicker'
import { getEventById, updateEvent } from '../../services/event.service'

function EditEvent() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [organizerIds, setOrganizerIds] = useState<number[]>([])

  useEffect(() => {
    if (!id) return
    getEventById(Number(id))
      .then(event => {
        setTitle(event.title)
        setDescription(event.description)
        setImage(event.image ?? '')
        setDate(event.date ? event.date.slice(0, 16) : '')
        setLocation(event.location ?? '')
        setOrganizerIds((event.organizers ?? []).map(o => o.id))
      })
      .catch(() => setError('Não foi possível carregar o evento'))
      .finally(() => setFetching(false))
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    setLoading(true)
    setError('')
    try {
      await updateEvent(Number(id), {
        title,
        description,
        image: image || undefined,
        date: date || undefined,
        location,
        organizerIds,
      })
      navigate(-1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar evento')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="training-page">
        <div className="training-container">
          <p style={{ textAlign: 'center', color: '#888' }}>Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="training-page">
      <form className="training-container" onSubmit={handleSubmit}>
        <h1>Editar Evento</h1>

        <div className="form-section">
          <h2>Informações do Evento</h2>
          <Input
            name="title"
            type="text"
            placeholder="Título do evento"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <textarea
            name="description"
            placeholder="Descrição do evento"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <Input
            name="image"
            type="url"
            placeholder="URL da imagem (opcional)"
            value={image}
            onChange={e => setImage(e.target.value)}
          />
        </div>

        <div className="form-section">
          <h2>Data e local</h2>
          <Input
            name="date"
            type="datetime-local"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          <Input
            name="location"
            type="text"
            placeholder="Local do evento"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
        </div>

        <div className="form-section">
          <h2>Organizadores</h2>
          <OrganizerPicker value={organizerIds} onChange={setOrganizerIds} />
        </div>

        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Evento'}</Button>
        </div>
      </form>
    </div>
  )
}

export default EditEvent
