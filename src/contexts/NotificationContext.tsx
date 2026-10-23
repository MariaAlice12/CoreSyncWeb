import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { getToken } from '../utils/token'
import { BASE_URL } from '../services/api'
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notification.service'
import type { AppNotification } from '../types'

interface NotificationContextValue {
  items: AppNotification[]
  unread: number
  /** Última notificação recebida em tempo real (para exibir um aviso) */
  latest: AppNotification | null
  dismissLatest: () => void
  markRead: (id: number) => Promise<void>
  markAllRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [latest, setLatest] = useState<AppNotification | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([])
      setUnread(0)
      return
    }

    getMyNotifications()
      .then(res => {
        setItems(res.items)
        setUnread(res.unread)
      })
      .catch(() => {})

    // Socket.IO no namespace /notifications, autenticado com o JWT
    const socket = io(`${BASE_URL || window.location.origin}/notifications`, {
      auth: { token: getToken() },
      transports: ['websocket'],
    })
    socket.on('notification', (n: AppNotification) => {
      setItems(prev => [n, ...prev].slice(0, 50))
      setUnread(prev => prev + 1)
      setLatest(n)
    })
    return () => {
      socket.disconnect()
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

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider')
  return ctx
}
