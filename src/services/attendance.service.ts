import request from './api'
import type { Attendance, AttendanceSession } from '../types'

export const confirmAttendance = (trainingId: number, date: string) =>
  request<Attendance>('/attendance', { method: 'POST', body: JSON.stringify({ trainingId, date }) })

export const cancelAttendance = (id: number) =>
  request(`/attendance/${id}`, { method: 'DELETE' })

export const getMyAttendances = () =>
  request<Attendance[]>('/attendance/me')

export const getTrainingSessions = (trainingId: number, from?: string) =>
  request<AttendanceSession[]>(`/attendance/training/${trainingId}${from ? `?from=${from}` : ''}`)
