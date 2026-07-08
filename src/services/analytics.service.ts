import request from './api'
import type { AdminOverview, ProfessorPerformance } from '../types'

export const getAdminOverview = () =>
  request<AdminOverview>('/analytics/admin-overview')

export const getProfessorPerformance = (professorId?: number) =>
  request<ProfessorPerformance>(
    `/analytics/professor-performance${professorId ? `?professorId=${professorId}` : ''}`,
  )
