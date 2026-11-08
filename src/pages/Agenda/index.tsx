import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import type { EventInput } from '@fullcalendar/core'
import './style.css'
import { useAuth } from '../../contexts/AuthContext'
import NotificationBell from '../../components/NotificationBell'
import { getMyEnrollments, getTrainings } from '../../services/training.service'
import { getEvents } from '../../services/event.service'
import { getMyEventRegistrations } from '../../services/eventRegistration.service'
import { weekdayIndex } from '../../utils/schedule'
import { LEVEL_LABELS, type Event, type Training } from '../../types'

const TRAINING_COLOR = '#6366f1'
const EVENT_COLOR = '#0d9488'

/** "HH:mm" + duração do treino (padrão 90 min), limitado ao fim do dia. */
function endTime(hour: string, minutes = 90) {
  const [h, m] = hour.split(':').map(Number)
  const total = Math.min(h * 60 + (m || 0) + minutes, 23 * 60 + 59)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function trainingToEvent(t: Training): EventInput {
  return {
    id: `training-${t.id}`,
    title: `${t.modality} · ${LEVEL_LABELS[t.level] ?? t.level}`,
    daysOfWeek: t.weekdays.map(weekdayIndex).filter((d): d is number => d !== undefined),
    startTime: t.hour,
    endTime: endTime(t.hour, t.durationMinutes),
    color: TRAINING_COLOR,
    extendedProps: { kind: 'training', place: t.address },
  }
}

function eventToEvent(e: Event): EventInput {
  return {
    id: `event-${e.id}`,
    title: e.title,
    start: e.date,
    color: EVENT_COLOR,
    url: `/evento/${e.id}`,
    extendedProps: { kind: 'event', place: e.location },
  }
}

function Agenda() {
  const { userRole, userId } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<EventInput[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches

  useEffect(() => {
    async function load() {
      if (userRole === 'aluno') {
        // Atleta: treinos em que está matriculado e eventos em que se inscreveu
        const [enrollments, regs] = await Promise.all([getMyEnrollments(), getMyEventRegistrations()])
        return [
          ...enrollments.filter(e => e.active && e.training.active !== false).map(e => trainingToEvent(e.training)),
          ...regs.filter(r => r.active && r.event.date).map(r => eventToEvent(r.event)),
        ]
      }
      const [trainings, events] = await Promise.all([getTrainings(), getEvents()])
      const visible = userRole === 'admin' ? trainings : trainings.filter(t => t.professor?.id === userId)
      return [
        ...visible.filter(t => t.active !== false).map(trainingToEvent),
        ...events.filter(e => e.date).map(eventToEvent),
      ]
    }
    load()
      .then(setItems)
      .catch(() => setError('Não foi possível carregar a agenda'))
      .finally(() => setLoading(false))
  }, [userRole, userId])

  return (
    <div className="agenda-page">
      <header className="agenda-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>← Painel</button>
        <h1 className="agenda-header__title">Minha agenda</h1>
        <NotificationBell />
      </header>

      <main className="agenda-content">
        <div className="agenda-legend">
          <span className="agenda-legend__item"><span className="agenda-legend__dot" style={{ background: TRAINING_COLOR }} />Treinos</span>
          <span className="agenda-legend__item"><span className="agenda-legend__dot" style={{ background: EVENT_COLOR }} />Eventos</span>
        </div>
        {loading && <p className="empty-state">Carregando...</p>}
        {error && <p className="empty-state error">{error}</p>}
        {!loading && !error && (
          <div className="agenda-calendar">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              locale={ptBrLocale}
              initialView={isMobile ? 'timeGridDay' : 'timeGridWeek'}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: isMobile ? 'timeGridDay,dayGridMonth' : 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              events={items}
              height="auto"
              slotMinTime="06:00:00"
              slotMaxTime="23:00:00"
              allDaySlot={false}
              nowIndicator
              eventClick={info => {
                if (info.event.url) {
                  info.jsEvent.preventDefault()
                  navigate(info.event.url)
                }
              }}
              eventDidMount={info => {
                const place = info.event.extendedProps.place
                if (place) info.el.title = `${info.event.title} — ${place}`
              }}
            />
          </div>
        )}
      </main>
    </div>
  )
}

export default Agenda
