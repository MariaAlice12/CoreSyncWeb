import request from './api'
import type { PerformanceInput, PerformanceRecord } from '../types'

export const savePerformance = (attendanceId: number, data: PerformanceInput) =>
  request<PerformanceRecord>(`/performance/attendance/${attendanceId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

export const deletePerformance = (id: number) =>
  request(`/performance/${id}`, { method: 'DELETE' })
