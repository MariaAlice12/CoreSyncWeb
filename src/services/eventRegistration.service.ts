import request from './api'
import type { EventRegistration } from '../types'

export const registerInEvent = (eventId: number, userId: number) =>
  request<EventRegistration>('/event-registration', {
    method: 'POST',
    body: JSON.stringify({ eventId, userId }),
  })

export const getAllEventRegistrations = () =>
  request<EventRegistration[]>('/event-registration')

export const updateEventRegistration = (id: number, data: { active: boolean }) =>
  request<EventRegistration>(`/event-registration/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

export const removeEventRegistration = (id: number) =>
  request(`/event-registration/${id}`, { method: 'DELETE' })

export const getEventParticipants = (eventId: number) =>
  request<EventRegistration[]>(`/event-registration?eventId=${eventId}`)

export const getMyEventRegistrations = () =>
  request<EventRegistration[]>('/event-registration/me')
