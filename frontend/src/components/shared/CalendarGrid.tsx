import { cn } from '@/lib/utils'
import type { HodCalendarEvent } from '@/types/hod'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const EVENT_TONE: Record<HodCalendarEvent['type'], string> = {
  HOLIDAY: 'bg-danger',
  EXAM: 'bg-warning',
  CULTURAL: 'bg-purple',
  PHASE: 'bg-primary',
  OTHER: 'bg-text-muted',
}

export function CalendarGrid({
  events,
  year,
  month,
  onDayClick,
  onEventClick,
  readonly,
}: {
  events: HodCalendarEvent[]
  year: number
  month: number // 0-indexed
  onDayClick?: (date: string) => void
  onEventClick?: (e: HodCalendarEvent) => void
  readonly?: boolean
}) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const byDate = new Map<string, HodCalendarEvent[]>()
  events.forEach((e) => {
    const key = e.date.slice(0, 10)
    byDate.set(key, [...(byDate.get(key) ?? []), e])
  })

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-text-muted">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day == null) return <div key={i} className="min-h-[92px] border-b border-r border-border-light bg-surface-2/40" />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayEvents = byDate.get(dateStr) ?? []
          const isToday = dateStr === todayStr
          return (
            <div
              key={i}
              onClick={() => !readonly && onDayClick?.(dateStr)}
              className={cn(
                'min-h-[92px] border-b border-r border-border-light p-1.5',
                !readonly && 'cursor-pointer hover:bg-primary-light/30',
              )}
            >
              <div className={cn('mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                isToday ? 'bg-primary text-white' : 'text-text-secondary')}>{day}</div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <button
                    key={e.id}
                    onClick={(ev) => { ev.stopPropagation(); onEventClick?.(e) }}
                    className={cn('flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[10px] font-medium text-white', EVENT_TONE[e.type])}
                  >
                    {e.title}
                  </button>
                ))}
                {dayEvents.length > 3 && <div className="px-1 text-[10px] text-text-muted">+{dayEvents.length - 3} more</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
