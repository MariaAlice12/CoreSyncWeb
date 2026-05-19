const TOKEN_KEY = 'coresync_token'
const ROLE_KEY = 'coresync_role'
const USER_ID_KEY = 'coresync_user_id'

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token)
export const removeToken = (): void => localStorage.removeItem(TOKEN_KEY)

export const getRole = (): string | null => localStorage.getItem(ROLE_KEY)
export const setRole = (role: string): void => localStorage.setItem(ROLE_KEY, role)
export const removeRole = (): void => localStorage.removeItem(ROLE_KEY)

export const getUserId = (): number | null => {
  const v = localStorage.getItem(USER_ID_KEY)
  return v ? Number(v) : null
}
export const setUserId = (id: number): void => localStorage.setItem(USER_ID_KEY, String(id))
export const removeUserId = (): void => localStorage.removeItem(USER_ID_KEY)
