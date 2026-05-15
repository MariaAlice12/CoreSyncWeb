import request from './api'
import type { LoginPayload, RegisterPayload } from '../types'

export const login = (payload: LoginPayload) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify(payload) })

export const register = (payload: RegisterPayload) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
