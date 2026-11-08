import type { PerformanceMetric, SessionActivity } from '../types'
import { formatPace, formatSeconds } from './schedule'

export function formatMetric(m: PerformanceMetric) {
  return `${m.name}: ${m.value.toLocaleString('pt-BR')}${m.unit ? ` ${m.unit}` : ''}`
}

/** "3,00 km · 8:20 /km · 142 bpm" (só o que a atividade tiver) */
export function activitySummary(a: SessionActivity) {
  const parts: string[] = []
  if (a.distance > 0) parts.push(`${(a.distance / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km`)
  else parts.push(formatSeconds(a.movingTime))
  if (a.pace) parts.push(formatPace(a.pace))
  if (a.averageHeartrate) parts.push(`${Math.round(a.averageHeartrate)} bpm`)
  return parts.join(' · ')
}

export function ratingStars(rating: number | null | undefined) {
  if (!rating) return ''
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}
