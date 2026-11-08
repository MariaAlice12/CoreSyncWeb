import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard from '../ChartCard'
import { getSegmentation } from '../../services/analytics.service'
import { AXIS, BAR_RADIUS_H, GRID, SERIES, TOOLTIP } from '../../utils/chart'
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

const ROW_HEIGHT = 40
const LABEL_FONT = 12
const CHAR_WIDTH = 7.4 // largura média de um caractere a 12px (fonte do app)
const MAX_LABEL_WIDTH = 180
const fmtPct = (v: number | null) => (v === null ? '—' : `${v}%`)

/** Quebra o rótulo em até 2 linhas que caibam em `maxChars`, sem cortar palavras ao meio. */
function wrapLabel(text: string, maxChars: number): string[] {
  const lines: string[] = []
  let current = ''
  for (const word of text.split(' ')) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= maxChars || !current) current = next
    else {
      lines.push(current)
      current = word
    }
  }
  lines.push(current)
  return lines.length <= 2 ? lines : [lines[0], lines.slice(1).join(' ')]
}

type ChartRow = SegmentRow & { name: string; freq: number; freqLabel: string }

function SegmentTick({ x, y, payload, rows, maxChars }: {
  x?: number; y?: number; payload?: { value: string }; rows: Map<string, ChartRow>; maxChars: number
}) {
  const row = payload ? rows.get(payload.value) : undefined
  if (!row) return null
  const lines = wrapLabel(row.name, maxChars)
  const top = -((lines.length - 1) * 14) / 2 - 7
  return (
    <text x={(x ?? 0) - 8} y={(y ?? 0) + top} textAnchor="end" fontSize={LABEL_FONT} fill="#444">
      {lines.map((l, i) => <tspan key={i} x={(x ?? 0) - 8} dy={i === 0 ? 0 : 14}>{l}</tspan>)}
      <tspan x={(x ?? 0) - 8} dy={14} fill="#8a8a95" fontSize={11}>
        {row.enrollments} {row.enrollments === 1 ? 'matrícula' : 'matrículas'}
      </tspan>
    </text>
  )
}

function SegmentTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartRow }[] }) {
  if (!active || !payload?.length) return null
  const r = payload[0].payload
  return (
    <div style={{ ...TOOLTIP.contentStyle, background: 'white', padding: '8px 12px' }}>
      <div style={TOOLTIP.labelStyle}>{r.name}</div>
      <div style={{ color: '#444' }}>Frequência: <strong>{r.freqLabel}</strong></div>
      <div style={{ color: '#666' }}>{r.presentSessions} presenças de {r.expectedSessions} sessões previstas</div>
      <div style={{ color: '#666' }}>{r.enrollments} matrículas ativas</div>
    </div>
  )
}

/** Uma barra horizontal por segmento: frequência % (0–100), nome inteiro no eixo. */
function SegmentChart({ title, rows, label }: { title: string; rows: SegmentRow[]; label?: (k: string) => string }) {
  const data: ChartRow[] = rows.map(r => ({
    ...r,
    name: label ? label(r.key) : r.key,
    freq: r.frequencyPct ?? 0,
    freqLabel: r.frequencyPct === null ? 'sem sessões' : `${r.frequencyPct}%`,
  }))
  // Linhas sem matrícula ativa (só presenças avulsas) ficam só na tabela.
  const plotted = data.filter(r => r.enrollments > 0)
  const byKey = new Map(plotted.map(r => [r.key, r]))
  const longest = Math.max(10, ...plotted.map(r => r.name.length))
  const labelWidth = Math.min(MAX_LABEL_WIDTH, Math.ceil(longest * CHAR_WIDTH) + 20)
  const maxChars = Math.floor((labelWidth - 20) / CHAR_WIDTH)
  const height = Math.max(160, plotted.length * ROW_HEIGHT + 40)

  return (
    <ChartCard
      title={title}
      subtitle="Frequência nos últimos 30 dias (presenças ÷ sessões previstas)"
      height={height}
      table={{
        columns: ['Segmento', 'Matrículas ativas', 'Presenças', 'Sessões previstas', 'Frequência'],
        rows: data.map(r => [r.name, r.enrollments, r.presentSessions, r.expectedSessions, fmtPct(r.frequencyPct)]),
      }}
    >
      {plotted.length === 0 ? (
        <p className="empty-state">Sem dados para os filtros selecionados.</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={plotted} layout="vertical" margin={{ top: 4, right: 44, bottom: 4, left: 0 }}>
            <CartesianGrid {...GRID} vertical horizontal={false} />
            <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v: number) => `${v}%`} {...AXIS} />
            <YAxis
              type="category"
              dataKey="key"
              width={labelWidth}
              interval={0}
              axisLine={false}
              tickLine={false}
              tick={<SegmentTick rows={byKey} maxChars={maxChars} />}
            />
            <Tooltip content={<SegmentTooltip />} cursor={TOOLTIP.cursor} />
            <Bar dataKey="freq" name="Frequência" fill={SERIES[0]} radius={BAR_RADIUS_H} maxBarSize={18}>
              <LabelList
                dataKey="freqLabel"
                position="right"
                style={{ fill: '#444', fontSize: 12, fontWeight: 600 }}
              />
            </Bar>
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
              <span className="stat-tile__value">{fmtPct(data.totals.frequencyPct)}</span>
              <span className="stat-tile__label">frequência (últimos 30 dias)</span>
              <span className="stat-tile__detail">
                {data.totals.presentSessions} presenças de {data.totals.expectedSessions} sessões previstas
              </span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile__value">{data.totals.athletes}</span>
              <span className="stat-tile__label">atletas cadastrados</span>
              <span className="stat-tile__detail">
                {data.totals.athletes - data.totals.notEnrolledAthletes} em pelo menos uma turma
              </span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile__value">{fmtPct(data.totals.notEnrolledPct)}</span>
              <span className="stat-tile__label">sem matrícula em nenhuma turma</span>
              <span className="stat-tile__detail">
                {data.totals.notEnrolledAthletes} de {data.totals.athletes} atletas
              </span>
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
