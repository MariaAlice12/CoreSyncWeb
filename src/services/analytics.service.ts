import request from './api'
import type {
  AdminOverview,
  AthletePerformance,
  AttendanceRate,
  ProfessorPerformance,
  Segmentation,
} from '../types'

export const getAdminOverview = () =>
  request<AdminOverview>('/analytics/admin-overview')

export const getProfessorPerformance = (professorId?: number) =>
  request<ProfessorPerformance>(
    `/analytics/professor-performance${professorId ? `?professorId=${professorId}` : ''}`,
  )

export const getSegmentation = (filters: Record<string, string> = {}) => {
  const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => v))
  const qs = params.toString()
  return request<Segmentation>(`/analytics/segmentation${qs ? `?${qs}` : ''}`)
}

export const getAttendanceRate = (trainingId: number, weeks = 8) =>
  request<AttendanceRate>(`/analytics/attendance/${trainingId}?weeks=${weeks}`)

export const getAthletePerformance = (athleteId: number) =>
  request<AthletePerformance>(`/analytics/athlete/${athleteId}`)
