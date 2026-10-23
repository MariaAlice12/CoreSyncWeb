import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard from '../ChartCard'
import { getAttendanceRate } from '../../services/analytics.service'
import { getTrainingSessions } from '../../services/attendance.service'
import { formatSessionDate, nextSessions, parseISODate, toISODate } from '../../utils/schedule'
import { AXIS, BAR_RADIUS, GRID, SERIES, TOOLTIP } from '../../utils/chart'
import type { AttendanceRate, AttendanceSession, Training } from '../../types'
import './style.css'

function shortDate(iso: string) {
  return parseISODate(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

/** Presenças de um treino: histórico (taxa por sessão) e próximas sessões. */
function TrainingAttendance({ training }: { training: Training }) {
  const [rate, setRate] = useState<AttendanceRate | null>(null)
  const [upcoming, setUpcoming] = useState<AttendanceSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([getAttendanceRate(training.id, 8), getTrainingSessions(training.id, toISODate(new Date()))])
      .then(([r, s]) => {
        setRate(r)
        setUpcoming(s)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Não foi possível carregar as presenças'))
      .finally(() => setLoading(false))
  }, [training.id])

  if (loading) return <p className="empty-state">Carregando...</p>
  if (error) return <p className="empty-state error">{error}</p>
  if (!rate) return null

  const sessionsByDate = new Map(upcoming.map(s => [s.date, s]))
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

      {chartData.length === 0 ? (
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
