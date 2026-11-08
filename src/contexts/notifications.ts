import { createContext, useContext } from 'react'
import type { AppNotification } from '../types'

export interface NotificationContextValue {
  items: AppNotification[]
  unread: number
  /** Última notificação recebida em tempo real (para exibir um aviso) */
  latest: AppNotification | null
  dismissLatest: () => void
  markRead: (id: number) => Promise<void>
  markAllRead: () => Promise<void>
}

export const NotificationContext = createContext<NotificationContextValue | null>(null)

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider')
  return ctx
}
