import './style.css'
import { LEVEL_LABELS, type Enrollment, type TrainingLevel } from '../../types'

const LEVELS = Object.keys(LEVEL_LABELS) as TrainingLevel[]
const SHORT: Record<TrainingLevel, string> = { iniciante: 'Ini', intermediario: 'Int', avancado: 'Av' }

/** Distribuição da autoavaliação dos atletas matriculados numa turma. */
function LevelSummary({ enrollments }: { enrollments: Enrollment[] }) {
  const active = enrollments.filter(e => e.active)
  if (active.length === 0) return <span className="level-summary level-summary--empty">Sem matriculados</span>

  const counts = LEVELS.map(l => ({ level: l, n: active.filter(e => e.selfLevel === l).length }))
  const missing = active.filter(e => !e.selfLevel).length
  const title = [
    ...counts.map(c => `${LEVEL_LABELS[c.level]}: ${c.n}`),
    ...(missing ? [`Não informado: ${missing}`] : []),
  ].join(' · ')

  return (
    <span className="level-summary" title={`Autoavaliação dos alunos — ${title}`}>
      <span className="level-summary__bar" aria-hidden="true">
        {counts.map(c => c.n > 0 && (
          <span
            key={c.level}
            className={`level-summary__seg level-summary__seg--${c.level}`}
            style={{ flexGrow: c.n }}
          />
        ))}
        {missing > 0 && <span className="level-summary__seg level-summary__seg--none" style={{ flexGrow: missing }} />}
      </span>
      <span className="level-summary__text">
        {counts.map(c => `${c.n} ${SHORT[c.level]}`).join(' · ')}
        {missing > 0 && ` · ${missing} ?`}
      </span>
    </span>
  )
}

export function SelfLevelTag({ level }: { level?: TrainingLevel | null }) {
  return (
    <span className={`self-level-tag self-level-tag--${level ?? 'none'}`}>
      {level ? LEVEL_LABELS[level] : 'Nível não informado'}
    </span>
  )
}

export default LevelSummary
