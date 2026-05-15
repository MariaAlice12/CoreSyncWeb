import request from './api'
import type { TrainingPayload, Training, Enrollment } from '../types'

export const createTraining = (payload: TrainingPayload) =>
  request('/training', { method: 'POST', body: JSON.stringify(payload) })

export const getTrainings = () =>
  request<Training[]>('/training')

export const getTrainingById = (id: number) =>
  request<Training>(`/training/${id}`)

export const updateTraining = (id: number, payload: Partial<TrainingPayload>) =>
  request(`/training/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })

export const deleteTraining = (id: number) =>
  request(`/training/${id}`, { method: 'DELETE' })

export const enrollInTraining = (trainingId: number, userId: number) =>
  request<Enrollment>('/enrollment', { method: 'POST', body: JSON.stringify({ trainingId, userId }) })

export const getMyEnrollments = () =>
  request<Enrollment[]>('/enrollment')

export const getAllEnrollments = () =>
  request<Enrollment[]>('/enrollment')

export const updateEnrollment = (enrollmentId: number, data: { active: boolean }) =>
  request<Enrollment>(`/enrollment/${enrollmentId}`, { method: 'PATCH', body: JSON.stringify(data) })

export const removeEnrollment = (enrollmentId: number) =>
  request(`/enrollment/${enrollmentId}`, { method: 'DELETE' })
