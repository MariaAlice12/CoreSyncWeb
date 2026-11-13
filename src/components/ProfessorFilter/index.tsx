import type { Training } from '../../types'
import { professorsOf, type ProfessorFilterValue } from '../../utils/professorFilter'

interface Props {
  trainings: Training[]
  value: ProfessorFilterValue
  onChange: (value: ProfessorFilterValue) => void
  /** Professor logado: adiciona a opção "Meus treinos" */
  meId?: number | null
}

function ProfessorFilter({ trainings, value, onChange, meId }: Props) {
  const professors = professorsOf(trainings).filter(p => p.id !== meId)
  const hasUnassigned = trainings.some(t => !t.professor)

  return (
    <select
      className="filter-bar__select"
      aria-label="Professor"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">Todos os professores</option>
      {meId != null && <option value={String(meId)}>Meus treinos</option>}
      {professors.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
      {hasUnassigned && <option value="none">Sem professor</option>}
    </select>
  )
}

export default ProfessorFilter
