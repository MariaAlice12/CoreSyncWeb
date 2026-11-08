import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard from '../ChartCard'
import { getSegmentation } from '../../services/analytics.service'
import { AXIS, BAR_RADIUS, GRID, LEGEND, SERIES, TOOLTIP } from '../../utils/chart'
import { LEVEL_LABELS, SHIFT_LABELS, type Segmentation, type SegmentRow, type Training, type User } from '../../types'

interface SegmentationPanelProps {
  trainings: Training[]
  users: User[]
}

type Filters = { modality: string; level: string; course: string; shift: string; campus: string }
const EMPTY: Filters = { modality: '', level: '', course: '', shift: '', campus: '' }

const DIMENSIONS: { key: keyof Omit<Segmentation, 'totals'>; title: string; label?: (k: string) => string }[] = [
  { key: 'byModality', title: 'Por modalidade' },
  { key: 'byLevel', title: 'Por nível (autoavaliação)', label: k => LEVEL_LABELS[k as keyof typeof LEVEL_LABELS] ?? k },
  { key: 'byCourse', title: 'Por curso' },
  { key: 'byShift', title: 'Por turno', label: k => SHIFT_LABELS[k as keyof typeof SHIFT_LABELS] ?? k },
  { key: 'byCampus', title: 'Por campus' },
]

const unique = (values: (string | null | undefined)[]) =>
  [...new Set(values.filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b, 'pt-BR'))

function SegmentChart({ title, rows, label }: { title: string; rows: SegmentRow[]; label?: (k: string) => string }) {
  const data = rows.map(r => ({ ...r, name: label ? label(r.key) : r.key }))
  return (
    <ChartCard
      title={title}
      table={{
        columns: ['Segmento', 'Matrículas ativas', 'Presenças (30 dias)'],
        rows: data.map(r => [r.name, r.enrollments, r.attendances]),
      }}
    >
      {data.length === 0 ? (
        <p className="empty-state">Sem dados para os filtros selecionados.</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }} barGap={2}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="name" {...AXIS} interval={0} tickFormatter={(v: string) => (v.length > 14 ? `${v.slice(0, 13)}…` : v)} />
            <YAxis allowDecimals={false} {...AXIS} axisLine={false} />
            <Tooltip {...TOOLTIP} />
            <Legend {...LEGEND} />
            <Bar dataKey="enrollments" name="Matrículas ativas" fill={SERIES[0]} radius={BAR_RADIUS} maxBarSize={28} />
            <Bar dataKey="attendances" name="Presenças (30 dias)" fill={SERIES[1]} radius={BAR_RADIUS} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

/** BI do admin: participação segmentada por modalidade, nível, curso, turno e campus. */
function SegmentationPanel({ trainings, users }: SegmentationPanelProps) {
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [data, setData] = useState<Segmentation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    getSegmentation(filters)
      .then(setData)
      .catch(() => setError('Não foi possível carregar a segmentação'))
      .finally(() => setLoading(false))
  }, [filters])

  const athletes = users.filter(u => u.userType === 'aluno')
  const options = {
    modality: unique(trainings.map(t => t.modality)),
    course: unique(athletes.map(u => u.course)),
    campus: unique([...athletes.map(u => u.campus), ...trainings.map(t => t.campus)]),
  }
  const set = (key: keyof Filters) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setFilters(prev => ({ ...prev, [key]: e.target.value }))
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="segmentation">
      <div className="filter-bar">
        <select className="filter-bar__select" aria-label="Modalidade" value={filters.modality} onChange={set('modality')}>
          <option value="">Todas as modalidades</option>
          {options.modality.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="filter-bar__select" aria-label="Nível (autoavaliação)" value={filters.level} onChange={set('level')}>
          <option value="">Todos os níveis</option>
          {Object.entries(LEVEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="filter-bar__select" aria-label="Curso" value={filters.course} onChange={set('course')}>
          <option value="">Todos os cursos</option>
          {options.course.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filter-bar__select" aria-label="Turno" value={filters.shift} onChange={set('shift')}>
          <option value="">Todos os turnos</option>
          {Object.entries(SHIFT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="filter-bar__select" aria-label="Campus" value={filters.campus} onChange={set('campus')}>
          <option value="">Todos os campi</option>
          {options.campus.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {hasFilters && (
          <button className="row-btn row-btn--edit" onClick={() => setFilters(EMPTY)}>Limpar filtros</button>
        )}
      </div>

      {error && <p className="empty-state error">{error}</p>}
      {loading && !data && <p className="empty-state">Carregando...</p>}
      {data && (
        <>
          <div className="stat-row">
            <div className="stat-tile">
              <span className="stat-tile__value">{data.totals.athletes}</span>
              <span className="stat-tile__label">atletas cadastrados</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile__value">{data.totals.enrolledAthletes}</span>
              <span className="stat-tile__label">atletas matriculados</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile__value">{data.totals.activeEnrollments}</span>
              <span className="stat-tile__label">matrículas ativas</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile__value">{data.totals.attendancesLast30Days}</span>
              <span className="stat-tile__label">presenças nos últimos 30 dias</span>
            </div>
          </div>
          <div className="chart-grid">
            {DIMENSIONS.map(d => (
              <SegmentChart key={d.key} title={d.title} rows={data[d.key]} label={d.label} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default SegmentationPanel
