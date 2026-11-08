import { useState } from 'react'
import { deletePerformance, savePerformance } from '../../services/performance.service'
import type { PerformanceRecord } from '../../types'
import './style.css'

interface MetricRow {
  name: string
  value: string
  unit: string
}

interface PerformanceFormProps {
  attendanceId: number
  athleteName: string
  initial: PerformanceRecord | null
  onSaved: (record: PerformanceRecord) => void
  onDeleted: () => void
  onClose: () => void
}

const MAX_METRICS = 10

/** Formulário inline para o professor registrar o desempenho do atleta na sessão. */
function PerformanceForm({ attendanceId, athleteName, initial, onSaved, onDeleted, onClose }: PerformanceFormProps) {
  const [rating, setRating] = useState<number | null>(initial?.rating ?? null)
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [metrics, setMetrics] = useState<MetricRow[]>(
    initial?.metrics.map(m => ({ name: m.name, value: String(m.value), unit: m.unit ?? '' })) ?? [],
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function updateMetric(index: number, field: keyof MetricRow, value: string) {
    setMetrics(prev => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const filled = metrics.filter(m => m.name.trim() || m.value.trim())
    const invalid = filled.find(m => !m.name.trim() || m.value.trim() === '' || isNaN(Number(m.value.replace(',', '.'))))
    if (invalid) {
      setError('Cada métrica precisa de um nome e de um valor numérico')
      return
    }
    if (!rating && !notes.trim() && filled.length === 0) {
      setError('Informe uma nota, uma observação ou uma métrica')
      return
    }
    setBusy(true)
    try {
      const record = await savePerformance(attendanceId, {
        ...(rating ? { rating } : {}),
        notes: notes.trim(),
        metrics: filled.map(m => ({
          name: m.name.trim(),
          value: Number(m.value.replace(',', '.')),
          ...(m.unit.trim() ? { unit: m.unit.trim() } : {}),
        })),
      })
      onSaved(record)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!initial || !window.confirm(`Remover o desempenho registrado de ${athleteName}?`)) return
    setBusy(true)
    setError('')
    try {
      await deletePerformance(initial.id)
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível remover')
      setBusy(false)
    }
  }

  return (
    <form className="perf-form" onSubmit={handleSubmit}>
      <div className="perf-form__field">
        <span className="perf-form__label">Nota da sessão</span>
        <div className="perf-form__stars" role="radiogroup" aria-label="Nota de 1 a 5">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} de 5`}
              className={`perf-form__star${rating && n <= rating ? ' perf-form__star--on' : ''}`}
              onClick={() => setRating(rating === n ? null : n)}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <label className="perf-form__field">
        <span className="perf-form__label">Observações</span>
        <textarea
          className="perf-form__notes"
          rows={2}
          maxLength={2000}
          value={notes}
          placeholder="Ex.: boa evolução na recepção, ajustar o posicionamento"
          onChange={e => setNotes(e.target.value)}
        />
      </label>

      <div className="perf-form__field">
        <span className="perf-form__label">Métricas</span>
        {metrics.map((m, i) => (
          <div key={i} className="perf-form__metric">
            <input
              aria-label="Nome da métrica"
              placeholder="Saques certos"
              maxLength={60}
              value={m.name}
              onChange={e => updateMetric(i, 'name', e.target.value)}
            />
            <input
              aria-label="Valor"
              placeholder="12"
              inputMode="decimal"
              value={m.value}
              onChange={e => updateMetric(i, 'value', e.target.value)}
            />
            <input
              aria-label="Unidade"
              placeholder="un"
              maxLength={20}
              value={m.unit}
              onChange={e => updateMetric(i, 'unit', e.target.value)}
            />
            <button
              type="button"
              className="perf-form__remove"
              aria-label="Remover métrica"
              onClick={() => setMetrics(prev => prev.filter((_, j) => j !== i))}
            >
              ×
            </button>
          </div>
        ))}
        {metrics.length < MAX_METRICS && (
          <button
            type="button"
            className="perf-form__add"
            onClick={() => setMetrics(prev => [...prev, { name: '', value: '', unit: '' }])}
          >
            + Adicionar métrica
          </button>
        )}
      </div>

      {error && <p className="perf-form__error">{error}</p>}

      <div className="perf-form__actions">
        {initial && (
          <button type="button" className="perf-form__delete" disabled={busy} onClick={handleDelete}>
            Remover
          </button>
        )}
        <button type="button" className="perf-form__cancel" disabled={busy} onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="perf-form__save" disabled={busy}>
          {busy ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}

export default PerformanceForm
