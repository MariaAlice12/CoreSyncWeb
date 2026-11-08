import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './style.css'
import Input from '../../components/Input'
import Select from '../../components/Select'
import Button from '../../components/Button'
import ModalityInput from '../../components/ModalityInput'
import useForm from '../../hooks/useForm'
import { createTraining } from '../../services/training.service'
import { getUsers } from '../../services/user.service'
import { useAuth } from '../../contexts/AuthContext'
import { type TrainingPayload, type User } from '../../types'


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
  durationMinutes: '90',
  address: '',
  description: '',
  maxStudents: '',
  minStudents: '',
  professorId: '',
  campus: '',
}

function CreateTraining() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [weekdays, setWeekdays] = useState<string[]>([])
  const [professors, setProfessors] = useState<User[]>([])
  const navigate = useNavigate()
  const { userRole } = useAuth()
  const { values, handleChange, setValues } = useForm(INITIAL)

  useEffect(() => {
    if (userRole === 'admin') {
      getUsers().then(users => setProfessors(users.filter(u => u.userType === 'professor')))
    }
  }, [userRole])

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
    if (userRole === 'admin' && !values.professorId) {
      setError('Selecione o professor responsável')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload: TrainingPayload = {
        modality: values.modality,
        hour: values.hour,
        durationMinutes: Number(values.durationMinutes) || 90,
        address: values.address,
        weekdays,
        description: values.description || undefined,
        maxStudents: Number(values.maxStudents),
        minStudents: Number(values.minStudents),
        campus: values.campus || undefined,
        ...(userRole === 'admin' ? { professorId: Number(values.professorId) } : {}),
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
          <ModalityInput value={values.modality} onChange={modality => setValues(v => ({ ...v, modality }))} />
          {userRole === 'admin' && (
            <Select
              name="professorId"
              placeholder="Professor responsável"
              options={professors.map(p => ({ value: String(p.id), label: p.name }))}
              value={values.professorId}
              onChange={handleChange}
            />
          )}
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
          <div className="row">
            <Input name="hour" type="time" label="Início" required value={values.hour} onChange={handleChange} />
            <Input
              name="durationMinutes"
              type="number"
              label="Duração (min)"
              min={15}
              max={300}
              step={5}
              required
              value={values.durationMinutes}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Local</h2>
          <Input name="address" type="text" placeholder="Endereço / Local do treino" value={values.address} onChange={handleChange} />
          <Input name="campus" type="text" placeholder="Campus / unidade (opcional)" value={values.campus} onChange={handleChange} />
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
