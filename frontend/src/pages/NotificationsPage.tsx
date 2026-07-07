import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Bell, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { notificationsApi, type Notification } from '@/api/notifications'
import { errorMessage } from '@/api/client'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
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

export default function NotificationsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'all' | 'unread'>('all')

  const list = useQuery({
    queryKey: ['notifications', 'page', tab],
    queryFn: () => notificationsApi.list({ page: 1, limit: 50, unreadOnly: tab === 'unread' }),
  })

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (e) => toast.error(errorMessage(e)),
  })
  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => { toast.success('All marked read'); qc.invalidateQueries({ queryKey: ['notifications'] }) },
    onError: (e) => toast.error(errorMessage(e)),
  })

  function handleClick(n: Notification) {
    if (!n.isRead) markRead.mutate(n.id)
    if (n.linkPath) navigate(n.linkPath)
  }

  return (
    <PageShell
      title="Notifications"
      subtitle={list.data ? `${list.data.total} total` : 'Your notifications'}
      action={
        <Button variant="outline" leftIcon={<CheckCheck size={15} />} onClick={() => markAll.mutate()} loading={markAll.isPending}>
          Mark all read
        </Button>
      }
    >
      <div className="mb-4">
        <Tabs
          value={tab}
          onChange={(k) => setTab(k as 'all' | 'unread')}
          tabs={[{ key: 'all', label: 'All' }, { key: 'unread', label: 'Unread' }]}
        />
      </div>

      {list.isLoading ? (
        <CardSkeleton height={200} />
      ) : (list.data?.data ?? []).length === 0 ? (
        <EmptyState icon={<Bell size={22} />} title="All caught up" description="No notifications to show." />
      ) : (
        <div className="space-y-2">
          {list.data?.data.map((n) => (
            <Card
              key={n.id}
              onClick={() => handleClick(n)}
              className={cn('cursor-pointer p-4 transition hover:shadow-md', !n.isRead && 'border-primary bg-primary-light/30')}
            >
              <div className="flex gap-3">
                <span className="mt-0.5 text-xl">{TYPE_ICON[n.type] ?? '🔔'}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold text-text-primary">{n.title}</div>
                    {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <div className="mt-0.5 text-sm text-text-secondary">{n.body}</div>
                  <div className="mt-1.5 text-xs text-text-muted">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  )
}
