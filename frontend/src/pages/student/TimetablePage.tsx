import { useQuery } from '@tanstack/react-query'
import { CalendarDays } from 'lucide-react'
import { studentApi } from '@/api/student'
import { PageShell } from '@/components/shared/PageShell'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
type Slot = { id: string; dayOfWeek?: number; startTime: string; endTime: string; subject?: { code: string; name: string }; facultyName?: string; room?: string }

export default function TimetablePage() {
  const timetable = useQuery({ queryKey: ['student', 'timetable'], queryFn: studentApi.timetable })
  const slots = (timetable.data as { slots?: Slot[] })?.slots ?? []

  return (
    <PageShell title="Timetable" subtitle="Weekly class schedule">
      <Card>
        <CardHeader title="Weekly Schedule" action={<CalendarDays size={16} className="text-text-muted" />} />
        <CardBody className="pt-0">
          {timetable.isLoading ? <CardSkeleton height={280} /> : slots.length === 0 ? (
            <EmptyState title="No timetable set" description="Your batch timetable will appear here." className="border-0" />
          ) : (
            <div className="space-y-3">
              {DAYS.map((day, di) => {
                const daySlots = slots.filter((s) => (s.dayOfWeek ?? 0) === di)
                if (daySlots.length === 0) return null
                return (
                  <div key={day}>
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">{day}</div>
                    <ul className="space-y-1.5">
                      {daySlots.map((s) => (
                        <li key={s.id} className="flex items-center gap-3 rounded-sm border border-border px-3 py-2">
                          <span className="min-w-[100px] text-sm font-semibold text-primary">{s.startTime}–{s.endTime}</span>
                          <span className="flex-1 text-[13px] font-medium text-text-primary">
                            {s.subject?.code} <span className="text-text-muted">· {s.subject?.name}</span>
                          </span>
                          {s.facultyName && <span className="text-xs text-text-secondary">{s.facultyName}</span>}
                          {s.room && <Badge tone="neutral">Room {s.room}</Badge>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </PageShell>
  )
}
