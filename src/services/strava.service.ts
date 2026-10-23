import request from './api'
import type { StravaActivity, StravaStatus } from '../types'

export const getStravaActivities = () =>
  request<StravaActivity[]>('/strava')

export const syncStravaActivities = (perPage = 30) =>
  request<StravaActivity[]>(`/strava/sync?perPage=${perPage}`)

export const getStravaStatus = () =>
  request<StravaStatus>('/strava/status')

export const getStravaConnectUrl = () =>
  request<{ url: string }>('/strava/connect')

export const disconnectStrava = () =>
  request('/strava/disconnect', { method: 'DELETE' })

export const getAthleteStravaActivities = (userId: number) =>
  request<StravaActivity[]>(`/strava/user/${userId}`)
