import request from './api'
import type { TrainingPayload } from '../types'

export const createTraining = (payload: TrainingPayload) =>
  request('/trainings', { method: 'POST', body: JSON.stringify(payload) })
