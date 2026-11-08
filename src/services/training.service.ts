import request from './api'
import type { TrainingPayload, Training, Enrollment, TrainingLevel } from '../types'

export const createTraining = (payload: TrainingPayload) =>
  request('/training', { method: 'POST', body: JSON.stringify(payload) })

export const getTrainings = () =>
  request<Training[]>('/training')

export const getModalities = () =>
  request<string[]>('/training/modalities')

export const getTrainingById = (id: number) =>
  request<Training>(`/training/${id}`)

export const updateTraining = (id: number, payload: Partial<TrainingPayload>) =>
  request(`/training/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })

export const deleteTraining = (id: number) =>
  request(`/training/${id}`, { method: 'DELETE' })

export const enrollInTraining = (trainingId: number, userId: number, selfLevel?: TrainingLevel) =>
  request<Enrollment>('/enrollment', { method: 'POST', body: JSON.stringify({ trainingId, userId, selfLevel }) })

export const getMyEnrollments = () =>
  request<Enrollment[]>('/enrollment/me')

export const getAllEnrollments = (filters: { trainingId?: number } = {}) =>
  request<Enrollment[]>(`/enrollment${filters.trainingId ? `?trainingId=${filters.trainingId}` : ''}`)

export const updateEnrollment = (enrollmentId: number, data: { active?: boolean; selfLevel?: TrainingLevel }) =>
  request<Enrollment>(`/enrollment/${enrollmentId}`, { method: 'PATCH', body: JSON.stringify(data) })

export const removeEnrollment = (enrollmentId: number) =>
  request(`/enrollment/${enrollmentId}`, { method: 'DELETE' })
