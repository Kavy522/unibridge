import { useQuery } from '@tanstack/react-query'
import { CalendarDays } from 'lucide-react'
import { facultyApi } from '@/api/faculty'
import { PageShell } from '@/components/shared/PageShell'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useFacultyScope } from '@/hooks/faculty/useFacultyScope'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function SchedulePage() {
  const scope = useFacultyScope()
  const timetable = useQuery({ queryKey: ['faculty', 'timetable'], queryFn: facultyApi.timetable })

  // Group slots by day
  const byDay = new Map<number, typeof timetable.data extends { slots: infer S } ? S extends readonly (infer I)[] ? I[] : never : never>()
  timetable.data?.slots.forEach((s) => {
    const d = s.dayOfWeek ?? 0
    if (!byDay.has(d)) byDay.set(d, [] as never)
    ;(byDay.get(d) as unknown as typeof s[]).push(s)
  })

  return (
    <PageShell title="My Schedule" subtitle={scope.data ? `${scope.data.activeSemester.label}` : 'Weekly timetable'}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {scope.data?.assignments.map((a) => (
          <Card key={a.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-text-primary">{a.subject.code}</div>
                <div className="text-xs text-text-muted">{a.subject.name}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge tone="primary">Batch {a.batch.code}</Badge>
                  <Badge tone="neutral">{a.subject.type}</Badge>
                </div>
              </div>
              {a.studentCount != null && (
                <div className="text-right">
                  <div className="text-lg font-bold text-text-primary">{a.studentCount}</div>
                  <div className="text-[11px] text-text-muted">students</div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Weekly Timetable" action={<CalendarDays size={16} className="text-text-muted" />} />
        <CardBody className="pt-0">
          {timetable.isLoading ? (
            <CardSkeleton height={280} />
          ) : timetable.data && timetable.data.slots.length === 0 ? (
            <EmptyState title="No timetable set" description="Contact your HOD to add timetable slots." className="border-0" />
          ) : (
            <div className="space-y-3">
              {DAYS.map((day, di) => {
                const slots = timetable.data?.slots.filter((s) => (s.dayOfWeek ?? 0) === di) ?? []
                if (slots.length === 0) return null
                return (
                  <div key={day}>
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">{day}</div>
                    <ul className="space-y-1.5">
                      {slots.map((s) => (
                        <li key={s.id} className="flex items-center gap-3 rounded-sm border border-border px-3 py-2">
                          <span className="min-w-[100px] text-sm font-semibold text-primary">{s.startTime}–{s.endTime}</span>
                          <span className="flex-1 text-[13px] font-medium text-text-primary">
                            {s.subject?.code ?? '—'} <span className="text-text-muted">· Batch {s.batch?.code}</span>
                          </span>
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
