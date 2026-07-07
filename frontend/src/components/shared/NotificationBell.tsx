import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { notificationsApi, type Notification } from '@/api/notifications'
import { useUser, portalOf } from '@/stores/authStore'
import { cn } from '@/lib/utils'

const TYPE_ICON: Record<string, string> = {
  RESULT_UPLOADED: '📋',
  FACULTY_ATTENDANCE_LOG: '✅',
  ANNOUNCEMENT: '📣',
  MENTOR_CHAT_MESSAGE: '💬',
  AT_RISK_ALERT: '⚠️',
  CALENDAR_REMINDER: '📅',
  PROMOTION_COMPLETED: '🚀',
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()
  const navigate = useNavigate()
  const user = useUser()
  const centerPath = user ? `/${portalOf(user).toLowerCase()}/notifications` : '/'

  const count = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 30_000, // ponytail: poll every 30s; upgrade to websocket if it matters
    staleTime: 15_000,
  })

  const list = useQuery({
    queryKey: ['notifications', 'top10'],
    queryFn: () => notificationsApi.list({ page: 1, limit: 10 }),
    enabled: open,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const unread = count.data?.count ?? 0

  function handleClick(n: Notification) {
    if (!n.isRead) markRead.mutate(n.id)
    setOpen(false)
    if (n.linkPath) navigate(n.linkPath)
  }

  return (
    <div ref={ref} className="relative">
      <button
        aria-label={`Notifications (${unread} unread)`}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-sm text-text-secondary hover:bg-surface-2"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-card border border-border bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="text-sm font-semibold text-text-primary">Notifications {unread > 0 && <span className="text-primary">({unread})</span>}</div>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                disabled={markAll.isPending}
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>
          <div className="scrollbar-thin max-h-96 overflow-y-auto">
            {list.isLoading ? (
              <div className="p-4 text-center text-xs text-text-muted">Loading…</div>
            ) : (list.data?.data ?? []).length === 0 ? (
              <div className="p-8 text-center text-xs text-text-muted">All caught up 🎉</div>
            ) : (
              <ul className="divide-y divide-border-light">
                {list.data?.data.map((n) => (
                  <li
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={cn('flex cursor-pointer gap-3 p-3 transition hover:bg-surface-2', !n.isRead && 'bg-primary-light/40')}
                  >
                    <span className="mt-0.5 text-lg">{TYPE_ICON[n.type] ?? '🔔'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-[13px] font-semibold text-text-primary">{n.title}</div>
                        {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-xs text-text-secondary">{n.body}</div>
                      <div className="mt-1 text-[10px] text-text-muted">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link
            to={centerPath}
            onClick={() => setOpen(false)}
            className="block border-t border-border bg-surface-2 py-2 text-center text-xs font-semibold text-primary hover:bg-surface"
          >
            See all
          </Link>
        </div>
      )}
    </div>
  )
}
