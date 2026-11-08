import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard from '../ChartCard'
import ShareResult from '../ShareResult'
import type { ShareCardData } from '../ShareResult/card'
import { getAthletePerformance } from '../../services/analytics.service'
import { formatPace, formatSeconds, parseISODate } from '../../utils/schedule'
import { AXIS, BAR_RADIUS, GRID, SERIES, TOOLTIP } from '../../utils/chart'
import { activitySummary, formatMetric, ratingStars } from '../../utils/performance'
import type { AthletePerformance, AthleteSession, StravaActivity } from '../../types'
import './style.css'

const RECENT_WEEKS = 12
const RECENT_ACTIVITIES = 15

function shortDate(value: string) {
  const d = value.length === 10 ? parseISODate(value) : new Date(value)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const RECENT_SESSIONS = 10

function longDate(value: string) {
  const d = value.length === 10 ? parseISODate(value) : new Date(value)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function activityShare(name: string, a: StravaActivity): ShareCardData {
  const stats = [
    ...(a.distance > 0 ? [{ label: 'distância', value: `${(a.distance / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km` }] : []),
    { label: 'tempo', value: formatSeconds(a.movingTime) },
    ...(a.pace ? [{ label: 'ritmo', value: formatPace(a.pace) }] : []),
    ...(a.averageHeartrate ? [{ label: 'FC média', value: `${Math.round(a.averageHeartrate)} bpm` }] : []),
  ]
  return { athleteName: name, title: a.name, subtitle: a.sportType ?? a.type, date: longDate(a.startDate), stats, source: 'strava' }
}

function sessionShare(name: string, s: AthleteSession): ShareCardData {
  const perf = s.performance
  const stats = [
    ...(perf?.metrics ?? []).map(m => ({ label: m.name, value: `${m.value.toLocaleString('pt-BR')}${m.unit ? ` ${m.unit}` : ''}` })),
    ...(s.activity && s.activity.distance > 0
      ? [{ label: 'distância', value: `${(s.activity.distance / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km` }]
      : []),
    ...(s.activity?.averageHeartrate ? [{ label: 'FC média', value: `${Math.round(s.activity.averageHeartrate)} bpm` }] : []),
  ]
  return {
    athleteName: name,
    title: `Treino de ${s.training.modality}`,
    date: longDate(s.date),
    stats,
    rating: perf?.rating,
    notes: perf?.notes,
    source: 'coresync',
  }
}

/** Indicadores, gráficos e atividades do atleta (presenças + Strava + desempenho registrado). */
function AthletePerformanceView({ athleteId, shareable = false }: { athleteId: number; shareable?: boolean }) {
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
  const ratings = data.ratingByWeek.slice(-RECENT_WEEKS).map(r => ({ ...r, label: shortDate(r.week) }))
  const sessions = data.sessions.filter(s => s.activity || s.performance).slice(0, RECENT_SESSIONS)

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

      {ratings.length > 0 && (
        <ChartCard
          title="Avaliação do professor"
          subtitle="Nota média por semana (1 a 5)"
          table={{ columns: ['Semana de', 'Nota média', 'Sessões avaliadas'], rows: ratings.map(r => [r.label, r.average.toLocaleString('pt-BR'), r.count]) }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ratings} margin={{ top: 8, right: 16, bottom: 0, left: -24 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="label" {...AXIS} />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} {...AXIS} axisLine={false} />
              <Tooltip
                {...TOOLTIP}
                labelFormatter={l => `Semana de ${l}`}
                formatter={(value, _n, item) => [`${Number(value).toLocaleString('pt-BR')} (${item.payload.count} ${item.payload.count === 1 ? 'sessão' : 'sessões'})`, 'Nota média']}
              />
              <Line type="monotone" dataKey="average" name="Nota média" stroke={SERIES[0]} strokeWidth={2} dot={{ r: 4, fill: SERIES[0] }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {sessions.length > 0 && (
        <>
          <h3 className="performance__subtitle">Sessões de treino</h3>
          <div className="session-list">
            {sessions.map(s => (
              <div key={s.attendanceId} className="session-item">
                <div className="session-item__header">
                  <div>
                    <span className="session-item__modality">{s.training.modality}</span>
                    <span className="session-item__date">{longDate(s.date)}</span>
                  </div>
                  {s.performance?.rating ? (
                    <span className="session-item__stars" aria-label={`Nota ${s.performance.rating} de 5`}>
                      {ratingStars(s.performance.rating)}
                    </span>
                  ) : null}
                </div>
                {s.performance && s.performance.metrics.length > 0 && (
                  <div className="session-item__metrics">
                    {s.performance.metrics.map((m, i) => (
                      <span key={i} className="session-item__metric">{formatMetric(m)}</span>
                    ))}
                  </div>
                )}
                {s.performance?.notes && <p className="session-item__notes">“{s.performance.notes}”</p>}
                <div className="session-item__footer">
                  {s.activity ? (
                    <a
                      className="session-item__strava"
                      href={`https://www.strava.com/activities/${s.activity.stravaId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Strava: {activitySummary(s.activity)}
                    </a>
                  ) : (
                    <span className="session-item__muted">Sem atividade do Strava neste dia</span>
                  )}
                  {shareable && <ShareResult data={sessionShare(data.athlete.name, s)} />}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {data.attendanceByModality.length > 0 && (
        <div className="performance__modalities">
          {data.attendanceByModality.map(m => (
            <span key={m.modality} className="performance__modality">
              <span className="performance__modality-name">{m.modality}</span>: <strong>{m.count}</strong> {m.count === 1 ? 'presença' : 'presenças'}
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
                    Ver no Strava
                  </a>
                  {shareable && <ShareResult data={activityShare(data.athlete.name, a)} />}
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
