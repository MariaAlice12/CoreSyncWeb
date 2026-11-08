import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../contexts/notifications'
import type { AppNotification } from '../../types'
import './style.css'

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)} min`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`
  return new Date(iso).toLocaleDateString('pt-BR')
}

function NotificationBell() {
  const { items, unread, latest, dismissLatest, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  function handleOpen(n: AppNotification) {
    if (!n.read) markRead(n.id).catch(() => {})
    setOpen(false)
    dismissLatest()
    if (n.link) navigate(n.link)
  }

  return (
    <div className="notif" ref={ref}>
      <button
        className="notif__bell"
        aria-label={`Notificações${unread ? ` (${unread} não lidas)` : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && <span className="notif__count">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notif__panel" role="dialog" aria-label="Notificações">
          <div className="notif__panel-header">
            <strong>Notificações</strong>
            {unread > 0 && (
              <button className="notif__mark-all" onClick={() => markAllRead().catch(() => {})}>
                Marcar todas como lidas
              </button>
            )}
          </div>
          {items.length === 0 && <p className="notif__empty">Nenhuma notificação.</p>}
          <ul className="notif__list">
            {items.map(n => (
              <li key={n.id}>
                <button className={`notif__item${n.read ? '' : ' notif__item--unread'}`} onClick={() => handleOpen(n)}>
                  <span className="notif__title">{n.title}</span>
                  <span className="notif__message">{n.message}</span>
                  <span className="notif__time">{timeAgo(n.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {latest && !open && (
        <div className="notif__toast" role="status">
          <button className="notif__toast-body" onClick={() => handleOpen(latest)}>
            <strong>{latest.title}</strong>
            <span>{latest.message}</span>
          </button>
          <button className="notif__toast-close" aria-label="Fechar" onClick={dismissLatest}>×</button>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
