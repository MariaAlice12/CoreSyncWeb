import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './auth'
import { NotificationContext } from './notifications'
import { getToken } from '../utils/token'
import { BASE_URL } from '../services/api'
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notification.service'
import type { AppNotification } from '../types'

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [latest, setLatest] = useState<AppNotification | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return

    getMyNotifications()
      .then(res => {
        setItems(res.items)
        setUnread(res.unread)
      })
      .catch(() => {})

    // Socket.IO no namespace /notifications, autenticado com o JWT.
    // Com a API atrás de proxy (BASE_URL relativo, ex.: "/backend"), o namespace
    // fica na própria origem e o prefixo vai para o path do Socket.IO.
    const isRelative = BASE_URL.startsWith('/')
    const socket = io(`${isRelative ? window.location.origin : BASE_URL || window.location.origin}/notifications`, {
      auth: { token: getToken() },
      transports: ['websocket'],
      ...(isRelative ? { path: `${BASE_URL}/socket.io` } : {}),
    })
    socket.on('notification', (n: AppNotification) => {
      setItems(prev => [n, ...prev].slice(0, 50))
      setUnread(prev => prev + 1)
      setLatest(n)
    })
    return () => {
      socket.disconnect()
      // Ao sair da conta, não deixa as notificações de quem saiu na tela.
      setItems([])
      setUnread(0)
      setLatest(null)
    }
  }, [isAuthenticated])

  // O aviso some sozinho depois de alguns segundos
  useEffect(() => {
    if (!latest) return
    const t = setTimeout(() => setLatest(null), 6000)
    return () => clearTimeout(t)
  }, [latest])

  const markRead = useCallback(async (id: number) => {
    await markNotificationRead(id)
    setItems(prev => prev.map(n => (n.id === id && !n.read ? { ...n, read: true } : n)))
    setUnread(prev => Math.max(0, prev - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead()
    setItems(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }, [])

  return (
    <NotificationContext.Provider
      value={{ items, unread, latest, dismissLatest: () => setLatest(null), markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
