export interface LoginPayload {
  email: string
  password: string
}

export type Shift = 'manha' | 'tarde' | 'noite' | 'integral'
export type TrainingLevel = 'iniciante' | 'intermediario' | 'avancado'

export const SHIFT_LABELS: Record<Shift, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  integral: 'Integral',
}

export const LEVEL_LABELS: Record<TrainingLevel, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}

export interface RegisterPayload {
  name: string
  email: string
  telephone: string
  password: string
  userType: 'aluno' | 'professor'
  course?: string
  shift?: Shift
  campus?: string
}

export interface TrainingPayload {
  modality: string
  hour: string
  durationMinutes?: number
  address: string
  weekdays: string[]
  description?: string
  maxStudents: number
  minStudents: number
  campus?: string
  professorId?: number
}

export interface EventPayload {
  title: string
  description: string
  image?: string
  date: string
  location?: string
  organizerIds?: number[]
  bracketType?: 'single' | 'double' | 'round-robin'
  teamCount?: number
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
  /** minutos (padrão 90) */
  durationMinutes?: number
  address: string
  weekdays: string[]
  description?: string
  active: boolean
  maxStudents: number
  minStudents: number
  campus?: string | null
  professor?: { id: number; name: string; email: string } | null
}

export interface Enrollment {
  id: number
  user: { id: number; name: string; email: string; userType: string }
  training: Training
  active: boolean
  /** Autoavaliação do atleta na matrícula (só informativo para o professor) */
  selfLevel?: TrainingLevel | null
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
  location?: string | null
  tournamentBracket?: TournamentBracket
  user?: { id: number; name: string }
  organizers?: { id: number; name: string; userType: string }[]
}

export interface EventPhoto {
  id: number
  url: string
  createdAt: string
  uploadedBy?: { id: number; name: string } | null
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
  course?: string | null
  shift?: Shift | null
  campus?: string | null
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
  averageHeartrate?: number | null
  maxHeartrate?: number | null
  averageCadence?: number | null
  /** segundos por km */
  pace: number | null
  startDate: string
}

export interface StravaStatus {
  configured: boolean
  connected: boolean
  athleteName: string | null
  connectedAt: string | null
}

export interface Attendance {
  id: number
  date: string
  training: Training
  user: { id: number; name: string }
}

export interface PerformanceMetric {
  name: string
  value: number
  unit?: string
}

/** Desempenho do atleta em uma sessão, registrado pelo professor */
export interface PerformanceRecord {
  id: number
  rating: number | null
  notes: string | null
  metrics: PerformanceMetric[]
  updatedAt: string
}

export interface PerformanceInput {
  rating?: number
  notes?: string
  metrics?: PerformanceMetric[]
}

/** Atividade do Strava do atleta no dia da sessão */
export interface SessionActivity {
  id: number
  stravaId: string
  name: string
  type: string
  distance: number
  movingTime: number
  /** segundos por km */
  pace: number | null
  averageHeartrate: number | null
  startDate: string
}

export interface SessionAttendee {
  id: number
  name: string
  attendanceId: number
  activity: SessionActivity | null
  performance: PerformanceRecord | null
}

export interface AttendanceSession {
  date: string
  count: number
  attendees: SessionAttendee[]
}

export interface AthleteSession {
  attendanceId: number
  date: string
  training: { id: number; modality: string }
  activity: SessionActivity | null
  performance: PerformanceRecord | null
}

export interface AppNotification {
  id: number
  title: string
  message: string
  type: string
  link: string | null
  read: boolean
  createdAt: string
}

export interface SegmentRow {
  key: string
  enrollments: number
  attendances: number
}

export interface Segmentation {
  totals: {
    athletes: number
    enrolledAthletes: number
    activeEnrollments: number
    attendancesLast30Days: number
  }
  byModality: SegmentRow[]
  byLevel: SegmentRow[]
  byCourse: SegmentRow[]
  byShift: SegmentRow[]
  byCampus: SegmentRow[]
}

export interface AttendanceRate {
  trainingId: number
  modality: string
  activeEnrollments: number
  averageRatePct: number
  sessions: { date: string; present: number; ratePct: number }[]
}

export interface AthletePerformance {
  athlete: { id: number; name: string; course?: string | null; shift?: Shift | null }
  totals: {
    attendances: number
    activities: number
    distanceKm: number
    movingTimeMin: number
    avgPace: number | null
    avgHeartrate: number | null
  }
  attendanceByWeek: { week: string; count: number }[]
  attendanceByModality: { modality: string; count: number }[]
  ratingByWeek: { week: string; average: number; count: number }[]
  sessions: AthleteSession[]
  activities: StravaActivity[]
}
