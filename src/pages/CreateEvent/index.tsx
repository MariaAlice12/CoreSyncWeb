import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../CreateTraining/style.css'
import Input from '../../components/Input'
import Button from '../../components/Button'
import Select from '../../components/Select'
import useForm from '../../hooks/useForm'
import { createEvent } from '../../services/event.service'
import type { EventPayload } from '../../types'

const INITIAL = { title: '', description: '', image: '', date: '', bracketType: '', teamCount: '' }

const BRACKET_OPTIONS = [
  { value: 'single', label: 'Eliminação simples' },
  { value: 'double', label: 'Eliminação dupla' },
  { value: 'round-robin', label: 'Todos contra todos' },
]

function CreateEvent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { values, handleChange } = useForm(INITIAL)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.title.trim()) {
      setError('O título é obrigatório')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload: EventPayload = {
        title: values.title,
        description: values.description,
        image: values.image || undefined,
        date: values.date,
        ...(values.bracketType
          ? {
              bracketType: values.bracketType as EventPayload['bracketType'],
              teamCount: values.teamCount ? Number(values.teamCount) : undefined,
            }
          : {}),
      }
      await createEvent(payload)
      navigate(-1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar evento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="training-page">
      <form className="training-container" onSubmit={handleSubmit}>
        <h1>Criar Evento</h1>

        <div className="form-section">
          <h2>Informações do Evento</h2>
          <Input name="title" type="text" placeholder="Título do evento" value={values.title} onChange={handleChange} />
          <textarea
            name="description"
            placeholder="Descrição do evento"
            value={values.description}
            onChange={handleChange}
          />
          <Input name="image" type="url" placeholder="URL da imagem (opcional)" value={values.image} onChange={handleChange} />
        </div>

        <div className="form-section">
          <h2>Data</h2>
          <Input name="date" type="datetime-local" value={values.date} onChange={handleChange} />
        </div>

        <div className="form-section">
          <h2>Chaveamento</h2>
          <Select
            name="bracketType"
            options={[{ value: '', label: 'Sem chaveamento' }, ...BRACKET_OPTIONS]}
            value={values.bracketType}
            onChange={handleChange}
          />
          {values.bracketType && (
            <Input name="teamCount" type="number" min={2} placeholder="Número de equipes" value={values.teamCount} onChange={handleChange} />
          )}
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

export default CreateEvent
