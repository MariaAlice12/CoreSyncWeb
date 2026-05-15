export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  telephone: string
  password: string
  userType: 'aluno' | 'professor' | 'admin'
}

export interface TrainingPayload {
  modality: string
  hour: string
  address: string
  weekdays: string[]
  description?: string
  maxStudents: number
  minStudents: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface AuthResponse {
  access_token: string
  user?: { id: number; name: string; email: string; userType: string }
}

export interface Training {
  id: number
  modality: string
  hour: string
  address: string
  weekdays: string[]
  description?: string
  active: boolean
  maxStudents: number
  minStudents: number
}

export interface Enrollment {
  id: number
  user: { id: number; name: string; email: string; userType: string }
  training: Training
  active: boolean
}
