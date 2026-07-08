export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  telephone: string
  password: string
  userType: 'aluno' | 'professor'
}

export interface TrainingPayload {
  modality: string
  hour: string
  address: string
  weekdays: string[]
  description?: string
  maxStudents: number
  minStudents: number
  professorId?: number
}

export interface EventPayload {
  title: string
  description: string
  image?: string
  date: string
  bracketGenerated?: boolean
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
  professor?: { id: number; name: string; email: string } | null
}

export interface Enrollment {
  id: number
  user: { id: number; name: string; email: string; userType: string }
  training: Training
  active: boolean
}

export interface TournamentBracket {
  id: string
  name: string
  type: 'single' | 'double' | 'round-robin'
  teamCount: number
}

export interface Event {
  id: number
  title: string
  description: string
  image?: string
  date?: string
  tournamentBracket?: TournamentBracket
  user?: { id: number; name: string }
}

export interface EventRegistration {
  id: number
  user: { id: number; name: string; email: string }
  event: Event
  active: boolean
}

export interface User {
  id: number
  name: string
  email: string
  telephone: string
  userType: 'aluno' | 'professor' | 'admin'
}

export interface SurveyResponse {
  id: number
  training: Training
  user: { id: number; name: string }
  rating: number
  comment?: string
  createdAt: string
}

export interface TrainingAnalyticsRow {
  trainingId: number
  modality: string
  professor: { id: number; name: string } | null
  activeCount: number
  inactiveCount: number
  maxStudents: number
  minStudents: number
  occupancyPct: number
  belowMinimum: boolean
  avgRating: number | null
  responseCount: number
}

export interface AdminOverview {
  trainings: TrainingAnalyticsRow[]
  totals: {
    totalTrainings: number
    totalActiveStudents: number
    trainingsBelowMinimum: number
  }
}

export interface ProfessorPerformance {
  professorId: number
  trainings: TrainingAnalyticsRow[]
  totals: {
    totalTrainings: number
    totalActiveStudents: number
    trainingsBelowMinimum: number
    overallAvgRating: number | null
  }
}

export interface StravaActivity {
  id: number
  stravaId: string
  name: string
  distance: number
  movingTime: number
  elapsedTime: number
  totalElevationGain: number
  type: string
  sportType?: string
  averageSpeed?: number
  maxSpeed?: number
  startDate: string
}
