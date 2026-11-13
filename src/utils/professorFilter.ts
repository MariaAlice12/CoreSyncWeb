import type { Training } from '../types'

/** '' = todos, 'none' = sem professor, '<id>' = treinos daquele professor */
export type ProfessorFilterValue = string

export function filterByProfessor(trainings: Training[], value: ProfessorFilterValue): Training[] {
  if (!value) return trainings
  if (value === 'none') return trainings.filter(t => !t.professor)
  return trainings.filter(t => String(t.professor?.id) === value)
}

/** Professores dos treinos (mais os extras), sem repetir, em ordem alfabética */
export function professorsOf(
  trainings: Training[],
  extra: { id: number; name: string }[] = [],
): { id: number; name: string }[] {
  const byId = new Map<number, string>(extra.map(p => [p.id, p.name]))
  for (const t of trainings) if (t.professor) byId.set(t.professor.id, t.professor.name)
  return [...byId].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}
