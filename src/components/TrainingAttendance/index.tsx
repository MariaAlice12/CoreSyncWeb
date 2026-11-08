import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard from '../ChartCard'
import PerformanceForm from '../PerformanceForm'
import { getAttendanceRate } from '../../services/analytics.service'
import { getTrainingSessions } from '../../services/attendance.service'
import { formatSessionDate, nextSessions, parseISODate, toISODate } from '../../utils/schedule'
import { AXIS, BAR_RADIUS, GRID, SERIES, TOOLTIP } from '../../utils/chart'
import { activitySummary, formatMetric, ratingStars } from '../../utils/performance'
import type { AttendanceRate, AttendanceSession, PerformanceRecord, Training } from '../../types'
import './style.css'

const RECENT_DAYS = 28
const RECENT_SESSIONS = 6

function shortDate(iso: string) {
  return parseISODate(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toISODate(d)
}

/** Presenças de um treino: histórico (taxa por sessão) e próximas sessões. */
function TrainingAttendance({ training }: { training: Training }) {
  const [rate, setRate] = useState<AttendanceRate | null>(null)
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  /** attendanceId com o formulário de desempenho aberto */
  const [editing, setEditing] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([getAttendanceRate(training.id, 8), getTrainingSessions(training.id, daysAgo(RECENT_DAYS))])
      .then(([r, s]) => {
        setRate(r)
        setSessions(s)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Não foi possível carregar as presenças'))
      .finally(() => setLoading(false))
  }, [training.id])

  function updatePerformance(attendanceId: number, performance: PerformanceRecord | null) {
    setSessions(prev =>
      prev.map(s => ({
        ...s,
        attendees: s.attendees.map(a => (a.attendanceId === attendanceId ? { ...a, performance } : a)),
      })),
    )
    setEditing(null)
  }

  if (loading) return <p className="empty-state">Carregando...</p>
  if (error) return <p className="empty-state error">{error}</p>
  if (!rate) return null

  const today = toISODate(new Date())
  const sessionsByDate = new Map(sessions.map(s => [s.date, s]))
  const recent = sessions
    .filter(s => s.date <= today && s.attendees.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, RECENT_SESSIONS)
  const nextDates = nextSessions(training, 4)
  const chartData = rate.sessions.map(s => ({ ...s, label: shortDate(s.date) }))

  return (
    <div className="training-attendance">
      <div className="stat-row">
        <div className="stat-tile">
          <span className="stat-tile__value">{rate.activeEnrollments}</span>
          <span className="stat-tile__label">alunos matriculados</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__value">{rate.averageRatePct}%</span>
          <span className="stat-tile__label">presença média (8 semanas)</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__value">{rate.sessions.length}</span>
          <span className="stat-tile__label">sessões registradas</span>
        </div>
      </div>

      {rate.sessions.every(s => s.present === 0) ? (
        <p className="empty-state">Ainda não há presenças registradas nas últimas semanas.</p>
      ) : (
        <ChartCard
          title="Taxa de presença por sessão"
          subtitle="Confirmados em relação aos alunos matriculados"
          table={{
            columns: ['Data', 'Presentes', 'Taxa'],
            rows: rate.sessions.map(s => [shortDate(s.date), s.present, `${s.ratePct}%`]),
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="label" {...AXIS} />
              <YAxis domain={[0, 100]} unit="%" {...AXIS} axisLine={false} />
              <Tooltip
                {...TOOLTIP}
                formatter={(value, _name, item) => [`${value}% (${item.payload.present} presentes)`, 'Presença']}
              />
              <Bar dataKey="ratePct" name="Presença" fill={SERIES[0]} radius={BAR_RADIUS} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <h3 className="training-attendance__subtitle">Sessões recentes: desempenho</h3>
      {recent.length === 0 ? (
        <p className="empty-state">Nenhuma sessão com presença nas últimas {RECENT_DAYS / 7} semanas.</p>
      ) : (
        <div className="recent-sessions">
          {recent.map(session => (
            <div key={session.date} className="session-card session-card--wide">
              <div className="session-card__header">
                <span className="session-card__date">{formatSessionDate(session.date)} · {training.hour}</span>
                <span className="session-card__count">{session.count} presentes</span>
              </div>
              <ul className="perf-list">
                {session.attendees.map(a => (
                  <li key={a.attendanceId} className="perf-list__item">
                    <div className="perf-list__row">
                      <div className="perf-list__info">
                        <span className="perf-list__name">{a.name}</span>
                        {a.activity && (
                          <a
                            className="perf-list__strava"
                            href={`https://www.strava.com/activities/${a.activity.stravaId}`}
                            target="_blank"
                            rel="noreferrer"
                            title={a.activity.name}
                          >
                            Strava: {activitySummary(a.activity)}
                          </a>
                        )}
                        {a.performance && (
                          <span className="perf-list__summary">
                            {a.performance.rating ? (
                              <span className="perf-list__stars" aria-label={`Nota ${a.performance.rating} de 5`}>
                                {ratingStars(a.performance.rating)}
                              </span>
                            ) : null}
                            {a.performance.metrics.map(formatMetric).join(' · ')}
                            {a.performance.notes ? ` · “${a.performance.notes}”` : ''}
                          </span>
                        )}
                      </div>
                      {editing !== a.attendanceId && (
                        <button className="perf-list__btn" onClick={() => setEditing(a.attendanceId)}>
                          {a.performance ? 'Editar' : 'Registrar desempenho'}
                        </button>
                      )}
                    </div>
                    {editing === a.attendanceId && (
                      <PerformanceForm
                        attendanceId={a.attendanceId}
                        athleteName={a.name}
                        initial={a.performance}
                        onSaved={record => updatePerformance(a.attendanceId, record)}
                        onDeleted={() => updatePerformance(a.attendanceId, null)}
                        onClose={() => setEditing(null)}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <h3 className="training-attendance__subtitle">Próximas sessões</h3>
      <div className="training-attendance__sessions">
        {nextDates.map(date => {
          const session = sessionsByDate.get(date)
          return (
            <div key={date} className="session-card">
              <div className="session-card__header">
                <span className="session-card__date">{formatSessionDate(date)} · {training.hour}</span>
                <span className="session-card__count">
                  {session?.count ?? 0}/{rate.activeEnrollments}
                </span>
              </div>
              {session && session.attendees.length > 0 ? (
                <ul className="session-card__list">
                  {session.attendees.map(a => <li key={a.attendanceId}>{a.name}</li>)}
                </ul>
              ) : (
                <p className="session-card__empty">Nenhuma confirmação ainda</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TrainingAttendance
