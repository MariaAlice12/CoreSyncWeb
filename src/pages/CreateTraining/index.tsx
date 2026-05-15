import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './style.css'
import Input from '../../components/Input'
import Select from '../../components/Select'
import Button from '../../components/Button'
import useForm from '../../hooks/useForm'
import { createTraining } from '../../services/training.service'
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

const INITIAL = {
  modality: '',
  hour: '',
  address: '',
  description: '',
  maxStudents: '',
  minStudents: '',
}

function CreateTraining() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [weekdays, setWeekdays] = useState<string[]>([])
  const navigate = useNavigate()
  const { values, handleChange } = useForm(INITIAL)

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
      const payload: TrainingPayload = {
        modality: values.modality,
        hour: values.hour,
        address: values.address,
        weekdays,
        description: values.description || undefined,
        maxStudents: Number(values.maxStudents),
        minStudents: Number(values.minStudents),
      }
      await createTraining(payload)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar treino')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="training-page">
      <form className="training-container" onSubmit={handleSubmit}>
        <h1>Criar Treino</h1>

        <div className="form-section">
          <h2>Informações do Treino</h2>
          <Select name="modality" placeholder="Modalidade" options={MODALIDADE_OPTIONS} value={values.modality} onChange={handleChange} />
          <textarea
            name="description"
            placeholder="Descrição do treino (opcional)"
            value={values.description}
            onChange={handleChange}
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
          <Input name="hour" type="time" value={values.hour} onChange={handleChange} />
        </div>

        <div className="form-section">
          <h2>Local</h2>
          <Input name="address" type="text" placeholder="Endereço / Local do treino" value={values.address} onChange={handleChange} />
        </div>

        <div className="form-section">
          <h2>Vagas</h2>
          <div className="row">
            <Input name="minStudents" type="number" placeholder="Mínimo de alunos" value={values.minStudents} onChange={handleChange} />
            <Input name="maxStudents" type="number" placeholder="Máximo de alunos" value={values.maxStudents} onChange={handleChange} />
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Treino'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateTraining
