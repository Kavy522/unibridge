import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types/auth'

interface AuthStore {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isFirstLogin: boolean
  setAuth: (payload: {
    user: AuthUser
    accessToken: string
    refreshToken: string
    isFirstLogin?: boolean
  }) => void
  setAccessToken: (token: string) => void
  setUser: (user: AuthUser) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isFirstLogin: false,
      setAuth: ({ user, accessToken, refreshToken, isFirstLogin = false }) =>
        set({ user, accessToken, refreshToken, isFirstLogin }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user }),
      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null, isFirstLogin: false }),
    }),
    { name: 'uniportal-auth', version: 1 },
  ),
)

// Convenience selectors — prefer these over reading the raw store.
export const useUser = () => useAuthStore((s) => s.user)
export const useIsHod = () => useAuthStore((s) => s.user?.isHod ?? false)
export const useIsFaculty = () =>
  useAuthStore((s) => s.user?.role === 'FACULTY' && !s.user?.isHod)
export const useIsStudent = () => useAuthStore((s) => s.user?.role === 'STUDENT')

/** The portal a user belongs to, used for redirects and nav selection. */
export function portalOf(user: AuthUser | null): 'HOD' | 'FACULTY' | 'STUDENT' {
  if (!user) return 'STUDENT'
  if (user.role === 'STUDENT') return 'STUDENT'
  return user.isHod ? 'HOD' : 'FACULTY'
}

/** Home path for a user's portal. */
export function homePathOf(user: AuthUser | null): string {
  switch (portalOf(user)) {
    case 'HOD':
      return '/hod'
    case 'FACULTY':
      return '/faculty'
    default:
      return '/student'
  }
}
