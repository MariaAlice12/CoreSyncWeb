import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../CreateTraining/style.css'
import Input from '../../components/Input'
import Select from '../../components/Select'
import Button from '../../components/Button'
import { getTrainingById, updateTraining } from '../../services/training.service'
import type { TrainingPayload } from '../../types'

const MODALIDADE_OPTIONS = [
  { value: 'atletismo', label: 'Atletismo' },
  { value: 'futebol', label: 'Futebol' },
  { value: 'volei', label: 'Vôlei' },
  { value: 'basquete', label: 'Basquete' },
  { value: 'judo', label: 'Judô' },
]

const DIAS = [
  { value: 'segunda', label: 'Seg' },
  { value: 'terca', label: 'Ter' },
  { value: 'quarta', label: 'Qua' },
  { value: 'quinta', label: 'Qui' },
  { value: 'sexta', label: 'Sex' },
  { value: 'sabado', label: 'Sáb' },
  { value: 'domingo', label: 'Dom' },
]

function EditTraining() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [modality, setModality] = useState('')
  const [weekdays, setWeekdays] = useState<string[]>([])
  const [hour, setHour] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [maxStudents, setMaxStudents] = useState('')
  const [minStudents, setMinStudents] = useState('')

  useEffect(() => {
    if (!id) return
    getTrainingById(Number(id))
      .then(t => {
        setModality(t.modality)
        setWeekdays(t.weekdays ?? [])
        setHour(t.hour)
        setAddress(t.address)
        setDescription(t.description ?? '')
        setMaxStudents(String(t.maxStudents))
        setMinStudents(String(t.minStudents))
      })
      .catch(() => setError('Não foi possível carregar o treino'))
      .finally(() => setLoadingData(false))
  }, [id])

  function toggleDay(day: string) {
    setWeekdays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (weekdays.length === 0) {
      setError('Selecione ao menos um dia da semana')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload: Partial<TrainingPayload> = {
        modality,
        hour,
        address,
        weekdays,
        description: description || undefined,
        maxStudents: Number(maxStudents),
        minStudents: Number(minStudents),
      }
      await updateTraining(Number(id), payload)
      navigate('/dashboard/professor')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar treino')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="training-page">
        <p style={{ color: '#888' }}>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="training-page">
      <form className="training-container" onSubmit={handleSubmit}>
        <h1>Editar Treino</h1>

        <div className="form-section">
          <h2>Informações do Treino</h2>
          <Select
            name="modality"
            placeholder="Modalidade"
            options={MODALIDADE_OPTIONS}
            value={modality}
            onChange={e => setModality(e.target.value)}
          />
          <textarea
            name="description"
            placeholder="Descrição do treino (opcional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="form-section">
          <h2>Agendamento</h2>
          <div className="days-selector">
            {DIAS.map(dia => (
              <button
                key={dia.value}
                type="button"
                className={`day-btn${weekdays.includes(dia.value) ? ' day-btn--active' : ''}`}
                onClick={() => toggleDay(dia.value)}
              >
                {dia.label}
              </button>
            ))}
          </div>
          <Input name="hour" type="time" value={hour} onChange={e => setHour(e.target.value)} />
        </div>

        <div className="form-section">
          <h2>Local</h2>
          <Input
            name="address"
            type="text"
            placeholder="Endereço / Local do treino"
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
        </div>

        <div className="form-section">
          <h2>Vagas</h2>
          <div className="row">
            <Input name="minStudents" type="number" placeholder="Mínimo de alunos" value={minStudents} onChange={e => setMinStudents(e.target.value)} />
            <Input name="maxStudents" type="number" placeholder="Máximo de alunos" value={maxStudents} onChange={e => setMaxStudents(e.target.value)} />
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={() => navigate('/dashboard/professor')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default EditTraining
