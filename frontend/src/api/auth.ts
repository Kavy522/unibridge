import { api } from './client'
import type { LoginResponse, LoginRole, AuthUser } from '@/types/auth'

export const authApi = {
  login(email: string, password: string, role: LoginRole) {
    return api
      .post<LoginResponse>('/auth/login', { email, password, role })
      .then((r) => r.data)
  },

  refresh(refreshToken: string) {
    return api
      .post<{ accessToken: string; expiresIn: number }>('/auth/refresh', { refreshToken })
      .then((r) => r.data)
  },

  logout(refreshToken: string) {
    return api.post('/auth/logout', { refreshToken }).then((r) => r.data)
  },

  me() {
    return api.get<AuthUser & Record<string, unknown>>('/auth/me').then((r) => r.data)
  },

  forgotPassword(email: string) {
    return api
      .post<{ message: string }>('/auth/forgot-password', { email })
      .then((r) => r.data)
  },
}
