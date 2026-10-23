import request from './api'
import type { Shift, User } from '../types'

export interface CreateUserPayload {
  name: string
  email: string
  telephone: string
  password: string
  userType: 'aluno' | 'professor' | 'admin'
  course?: string
  shift?: Shift
  campus?: string
}

export const createUser = (payload: CreateUserPayload) =>
  request<User>('/user', { method: 'POST', body: JSON.stringify(payload) })

export const getUsers = () =>
  request<User[]>('/user')

export const getUserById = (id: number) =>
  request<User>(`/user/${id}`)

export const updateUser = (id: number, payload: Partial<CreateUserPayload>) =>
  request(`/user/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })

export const deleteUser = (id: number) =>
  request(`/user/${id}`, { method: 'DELETE' })
