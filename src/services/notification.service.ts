import request from './api'
import type { AppNotification } from '../types'

export const getMyNotifications = () =>
  request<{ items: AppNotification[]; unread: number }>('/notification/me')

export const markNotificationRead = (id: number) =>
  request<AppNotification>(`/notification/${id}/read`, { method: 'PATCH' })

export const markAllNotificationsRead = () =>
  request('/notification/read-all', { method: 'PATCH' })
