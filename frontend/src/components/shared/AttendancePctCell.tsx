import { cn } from '@/lib/utils'
import { attendanceTone } from '@/lib/utils'
import { ProgressBar } from '@/components/ui/ProgressBar'

const textTone = { success: 'text-success', warning: 'text-warning', danger: 'text-danger' } as const

export function AttendancePctCell({
  pct,
  showBar = true,
  className,
}: {
  pct: number | null | undefined
  showBar?: boolean
  className?: string
}) {
  if (pct == null) return <span className="text-text-muted">—</span>
  const tone = attendanceTone(pct)
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showBar && <ProgressBar value={pct} tone={tone} className="w-16" height={6} />}
      <span className={cn('text-[13px] font-semibold tabular-nums', textTone[tone])}>
        {Math.round(pct)}%
      </span>
    </div>
  )
}
