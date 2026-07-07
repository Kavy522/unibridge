import { api } from './client'
import { useAuthStore } from '@/stores/authStore'

export interface Notification {
  id: string
  type: string
  title: string
  body: string
  linkPath?: string | null
  isRead: boolean
  createdAt: string
}

function base() {
  const u = useAuthStore.getState().user
  if (!u) return '/hod'
  if (u.role === 'STUDENT') return '/student'
  return u.isHod ? '/hod' : '/faculty'
}

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get<{ data: Notification[]; total: number; page: number; limit: number; totalPages: number }>(`${base()}/notifications`, { params }).then((r) => r.data),
  unreadCount: () => api.get<{ count: number }>(`${base()}/notifications/unread-count`).then((r) => r.data),
  markRead: (id: string) => api.patch(`${base()}/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch(`${base()}/notifications/mark-all-read`).then((r) => r.data),
}
