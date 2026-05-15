export interface LoginPayload {
  email: string
  senha: string
}

export interface RegisterPayload {
  nome: string
  email: string
  telefone: string
  senha: string
  funcao: string
}

export interface TrainingPayload {
  nome: string
  modalidade: string
  descricao: string
  tipo: 'esporadico' | 'fixo'
  data?: string
  diaSemana?: string
  horaInicio: string
  horaFim: string
  local: string
  capacidade: number
  nivel: string
  treinador: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
}
