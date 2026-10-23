import { useEffect, useState } from 'react'
import { cancelAttendance, confirmAttendance, getTrainingSessions } from '../../services/attendance.service'
import { formatSessionDate, nextSessions, toISODate } from '../../utils/schedule'
import type { Attendance, Training } from '../../types'
import './style.css'

interface AttendanceSessionsProps {
  training: Training
  /** Presenças do atleta logado neste treino */
  mine: Attendance[]
  onConfirmed: (attendance: Attendance) => void
  onCancelled: (attendanceId: number) => void
}

/** Próximas sessões do treino com check-in e número de confirmados. */
function AttendanceSessions({ training, mine, onConfirmed, onCancelled }: AttendanceSessionsProps) {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [busyDate, setBusyDate] = useState<string | null>(null)
  const [error, setError] = useState('')
  const dates = nextSessions(training, 3)

  useEffect(() => {
    getTrainingSessions(training.id, toISODate(new Date()))
      .then(sessions => setCounts(Object.fromEntries(sessions.map(s => [s.date, s.count]))))
      .catch(() => setCounts({}))
  }, [training.id])

  async function handleConfirm(date: string) {
    setBusyDate(date)
    setError('')
    try {
      const attendance = await confirmAttendance(training.id, date)
      onConfirmed({ ...attendance, training })
      setCounts(prev => ({ ...prev, [date]: (prev[date] ?? 0) + 1 }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível confirmar a presença')
    } finally {
      setBusyDate(null)
    }
  }

  async function handleCancel(date: string, attendanceId: number) {
    setBusyDate(date)
    setError('')
    try {
      await cancelAttendance(attendanceId)
      onCancelled(attendanceId)
      setCounts(prev => ({ ...prev, [date]: Math.max(0, (prev[date] ?? 1) - 1) }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível cancelar a presença')
    } finally {
      setBusyDate(null)
    }
  }

  if (dates.length === 0) return null

  return (
    <div className="attendance">
      <span className="attendance__title">Próximas sessões</span>
      <ul className="attendance__list">
        {dates.map(date => {
          const confirmed = mine.find(a => a.date === date)
          const count = counts[date] ?? 0
          return (
            <li key={date} className={`attendance__item${confirmed ? ' attendance__item--confirmed' : ''}`}>
              <div className="attendance__info">
                <span className="attendance__date">{formatSessionDate(date)} · {training.hour}</span>
                <span className="attendance__count">
                  {count} {count === 1 ? 'confirmado' : 'confirmados'} de {training.maxStudents}
                </span>
              </div>
              {confirmed ? (
                <div className="attendance__done">
                  <span className="attendance__check" aria-label="Presença confirmada">✓ Confirmado</span>
                  <button
                    className="attendance__cancel"
                    disabled={busyDate === date}
                    onClick={() => handleCancel(date, confirmed.id)}
                  >
                    Desfazer
                  </button>
                </div>
              ) : (
                <button
                  className="attendance__confirm"
                  disabled={busyDate === date}
                  onClick={() => handleConfirm(date)}
                >
                  {busyDate === date ? 'Aguarde...' : 'Vou treinar'}
                </button>
              )}
            </li>
          )
        })}
      </ul>
      {error && <p className="attendance__error">{error}</p>}
    </div>
  )
}

export default AttendanceSessions
