import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard from '../ChartCard'
import { getAthletePerformance } from '../../services/analytics.service'
import { formatPace, formatSeconds, parseISODate } from '../../utils/schedule'
import { AXIS, BAR_RADIUS, GRID, SERIES, TOOLTIP } from '../../utils/chart'
import type { AthletePerformance } from '../../types'
import './style.css'

const RECENT_WEEKS = 12
const RECENT_ACTIVITIES = 15

function shortDate(value: string) {
  const d = value.length === 10 ? parseISODate(value) : new Date(value)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

/** Indicadores, gráficos e atividades do atleta (presenças + Strava). */
function AthletePerformanceView({ athleteId }: { athleteId: number }) {
  const [data, setData] = useState<AthletePerformance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    getAthletePerformance(athleteId)
      .then(setData)
      .catch(err => setError(err instanceof Error ? err.message : 'Não foi possível carregar o desempenho'))
      .finally(() => setLoading(false))
  }, [athleteId])

  if (loading) return <p className="empty-state">Carregando...</p>
  if (error) return <p className="empty-state error">{error}</p>
  if (!data) return null

  const { totals } = data
  const weeks = data.attendanceByWeek.slice(-RECENT_WEEKS).map(w => ({ ...w, label: shortDate(w.week) }))
  const activities = data.activities.slice(-RECENT_ACTIVITIES).map(a => ({
    ...a,
    label: shortDate(a.startDate),
    km: Math.round(a.distance / 10) / 100,
  }))
  const latestFirst = [...data.activities].reverse()

  return (
    <div className="performance">
      <div className="stat-row">
        <div className="stat-tile">
          <span className="stat-tile__value">{totals.attendances}</span>
          <span className="stat-tile__label">presenças em treinos</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__value">{totals.distanceKm.toLocaleString('pt-BR')} km</span>
          <span className="stat-tile__label">em {totals.activities} atividades</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__value">{formatSeconds(totals.movingTimeMin * 60)}</span>
          <span className="stat-tile__label">tempo em movimento</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__value">{formatPace(totals.avgPace)}</span>
          <span className="stat-tile__label">ritmo médio</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__value">{totals.avgHeartrate ? `${totals.avgHeartrate} bpm` : '—'}</span>
          <span className="stat-tile__label">frequência cardíaca média</span>
        </div>
      </div>

      <div className="chart-grid">
        <ChartCard
          title="Presenças por semana"
          subtitle={`Últimas ${RECENT_WEEKS} semanas com treino`}
          table={{ columns: ['Semana de', 'Presenças'], rows: weeks.map(w => [w.label, w.count]) }}
        >
          {weeks.length === 0 ? (
            <p className="empty-state">Nenhuma presença registrada ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeks} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="label" {...AXIS} />
                <YAxis allowDecimals={false} {...AXIS} axisLine={false} />
                <Tooltip {...TOOLTIP} labelFormatter={l => `Semana de ${l}`} />
                <Bar dataKey="count" name="Presenças" fill={SERIES[0]} radius={BAR_RADIUS} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Distância por atividade"
          subtitle="Atividades importadas do Strava"
          table={{
            columns: ['Data', 'Atividade', 'Km', 'Ritmo', 'FC média'],
            rows: activities.map(a => [
              a.label, a.name, a.km.toLocaleString('pt-BR'), formatPace(a.pace),
              a.averageHeartrate ? `${Math.round(a.averageHeartrate)} bpm` : '—',
            ]),
          }}
        >
          {activities.length === 0 ? (
            <p className="empty-state">Nenhuma atividade do Strava ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activities} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="label" {...AXIS} />
                <YAxis unit=" km" {...AXIS} axisLine={false} width={64} />
                <Tooltip
                  {...TOOLTIP}
                  labelFormatter={(_l, items) => items?.[0]?.payload?.name ?? ''}
                  formatter={(value, _name, item) => [
                    `${Number(value).toLocaleString('pt-BR')} km · ${formatPace(item.payload.pace)}`,
                    'Distância',
                  ]}
                />
                <Bar dataKey="km" name="Distância" fill={SERIES[0]} radius={BAR_RADIUS} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {data.attendanceByModality.length > 0 && (
        <div className="performance__modalities">
          {data.attendanceByModality.map(m => (
            <span key={m.modality} className="performance__modality">
              {m.modality}: <strong>{m.count}</strong> {m.count === 1 ? 'presença' : 'presenças'}
            </span>
          ))}
        </div>
      )}

      {latestFirst.length > 0 && (
        <>
          <h3 className="performance__subtitle">Atividades</h3>
          <div className="strava-list">
            {latestFirst.map(a => (
              <div key={a.id} className="strava-card">
                <div className="strava-card__header">
                  <span className="strava-card__name">{a.name}</span>
                  <span className="strava-card__type">{a.sportType ?? a.type}</span>
                </div>
                <div className="strava-card__stats">
                  <div className="strava-stat">
                    <span className="strava-stat__value">{(a.distance / 1000).toFixed(2)}</span>
                    <span className="strava-stat__label">km</span>
                  </div>
                  <div className="strava-stat">
                    <span className="strava-stat__value">{formatSeconds(a.movingTime)}</span>
                    <span className="strava-stat__label">tempo</span>
                  </div>
                  <div className="strava-stat">
                    <span className="strava-stat__value">{formatPace(a.pace).replace(' /km', '')}</span>
                    <span className="strava-stat__label">ritmo /km</span>
                  </div>
                  {a.averageHeartrate ? (
                    <div className="strava-stat">
                      <span className="strava-stat__value">{Math.round(a.averageHeartrate)}</span>
                      <span className="strava-stat__label">bpm médio</span>
                    </div>
                  ) : null}
                  <div className="strava-stat">
                    <span className="strava-stat__value">{a.totalElevationGain.toFixed(0)}</span>
                    <span className="strava-stat__label">m ganho</span>
                  </div>
                </div>
                <div className="strava-card__footer">
                  <span className="strava-card__date">{new Date(a.startDate).toLocaleDateString('pt-BR')}</span>
                  <a
                    className="strava-card__link"
                    href={`https://www.strava.com/activities/${a.stravaId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver e compartilhar no Strava
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default AthletePerformanceView
