import type { Training } from '../types'

export const WEEKDAY_LABEL: Record<string, string> = {
  segunda: 'Segunda', terca: 'Terça', quarta: 'Quarta',
  quinta: 'Quinta', sexta: 'Sexta', sabado: 'Sábado', domingo: 'Domingo',
}

const WEEKDAY_INDEX: Record<string, number> = {
  dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6,
}

/** "terça-feira" / "terca" / "Sábado" → índice de Date.getDay() */
export function weekdayIndex(day: string): number | undefined {
  const key = day.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().slice(0, 3)
  return WEEKDAY_INDEX[key]
}

/** Data local no formato YYYY-MM-DD */
export function toISODate(d: Date): string {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

export function parseISODate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

/** Próximas `count` datas (a partir de hoje) em que o treino acontece. */
export function nextSessions(training: Pick<Training, 'weekdays'>, count = 3): string[] {
  const days = new Set(training.weekdays.map(weekdayIndex).filter((d): d is number => d !== undefined))
  if (days.size === 0) return []
  const result: string[] = []
  const d = new Date()
  while (result.length < count) {
    if (days.has(d.getDay())) result.push(toISODate(d))
    d.setDate(d.getDate() + 1)
  }
  return result
}

export function formatSessionDate(iso: string): string {
  const d = parseISODate(iso)
  const today = toISODate(new Date())
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (iso === today) return 'Hoje'
  if (iso === toISODate(tomorrow)) return 'Amanhã'
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

export function formatSeconds(s: number) {
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}min`
  return `${m}min`
}

/** Ritmo em segundos/km → "5:32 /km" */
export function formatPace(secondsPerKm: number | null | undefined): string {
  if (!secondsPerKm || !isFinite(secondsPerKm)) return '—'
  const min = Math.floor(secondsPerKm / 60)
  const sec = Math.round(secondsPerKm % 60)
  return `${min}:${String(sec).padStart(2, '0')} /km`
}
