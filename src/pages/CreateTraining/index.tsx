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

const TIPO_OPTIONS = [
  { value: 'esporadico', label: 'Treino Esporádico' },
  { value: 'fixo', label: 'Treino Fixo Semanal' },
]

const DIA_OPTIONS = [
  { value: 'segunda', label: 'Segunda' },
  { value: 'terca', label: 'Terça' },
  { value: 'quarta', label: 'Quarta' },
  { value: 'quinta', label: 'Quinta' },
  { value: 'sexta', label: 'Sexta' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
]

const NIVEL_OPTIONS = [
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
]

const INITIAL = {
  nome: '',
  modalidade: '',
  descricao: '',
  tipo: 'esporadico',
  data: '',
  diaSemana: '',
  horaInicio: '',
  horaFim: '',
  local: '',
  capacidade: '',
  nivel: '',
  treinador: '',
}

function CreateTraining() {
  const navigate = useNavigate()
  const { values, handleChange } = useForm(INITIAL)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: TrainingPayload = {
      ...values,
      tipo: values.tipo as 'esporadico' | 'fixo',
      capacidade: Number(values.capacidade),
    }
    await createTraining(payload)
    navigate('/')
  }

  return (
    <div className="training-page">
      <form className="training-container" onSubmit={handleSubmit}>
        <h1>Criar Treino</h1>

        <div className="form-section">
          <h2>Informações do Treino</h2>
          <Input name="nome" type="text" placeholder="Nome do treino" value={values.nome} onChange={handleChange} />
          <Select name="modalidade" placeholder="Modalidade" options={MODALIDADE_OPTIONS} value={values.modalidade} onChange={handleChange} />
          <textarea
            name="descricao"
            placeholder="Descrição do treino"
            value={values.descricao}
            onChange={handleChange}
          />
        </div>

        <div className="form-section">
          <h2>Agendamento</h2>
          <Select name="tipo" options={TIPO_OPTIONS} value={values.tipo} onChange={handleChange} />

          <div className="row">
            {values.tipo === 'esporadico' ? (
              <Input name="data" type="date" value={values.data} onChange={handleChange} />
            ) : (
              <Select name="diaSemana" placeholder="Dia da semana" options={DIA_OPTIONS} value={values.diaSemana} onChange={handleChange} />
            )}
            <Input name="horaInicio" type="time" value={values.horaInicio} onChange={handleChange} />
            <Input name="horaFim" type="time" value={values.horaFim} onChange={handleChange} />
          </div>
        </div>

        <div className="form-section">
          <h2>Local</h2>
          <Input name="local" type="text" placeholder="Local do treino" value={values.local} onChange={handleChange} />
          <h2>Capacidade de atletas</h2>
          <Input name="capacidade" type="number" value={values.capacidade} onChange={handleChange} />
        </div>

        <div className="form-section">
          <h2>Configurações</h2>
          <Select name="nivel" placeholder="Nível do treino" options={NIVEL_OPTIONS} value={values.nivel} onChange={handleChange} />
          <Input name="treinador" type="text" placeholder="Treinador responsável" value={values.treinador} onChange={handleChange} />
        </div>

        <Button type="submit">Salvar Treino</Button>
      </form>
    </div>
  )
}

export default CreateTraining
