import request from './api'
import type { Event, EventPayload, EventPhoto } from '../types'

export const createEvent = (payload: EventPayload) =>
  request<Event>('/event', { method: 'POST', body: JSON.stringify(payload) })

export const getEvents = () =>
  request<Event[]>('/event')

export const getEventById = (id: number) =>
  request<Event>(`/event/${id}`)

export const updateEvent = (id: number, payload: Partial<EventPayload>) =>
  request(`/event/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })

export const deleteEvent = (id: number) =>
  request(`/event/${id}`, { method: 'DELETE' })

export const getEventPhotos = (id: number) =>
  request<EventPhoto[]>(`/event/${id}/photos`)

export const uploadEventPhotos = (id: number, files: File[]) => {
  const form = new FormData()
  files.forEach(f => form.append('photos', f))
  return request<EventPhoto[]>(`/event/${id}/photos`, { method: 'POST', body: form })
}

export const deleteEventPhoto = (eventId: number, photoId: number) =>
  request(`/event/${eventId}/photos/${photoId}`, { method: 'DELETE' })
