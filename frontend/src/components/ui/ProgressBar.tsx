import { cn } from '@/lib/utils'
import { clampPct } from '@/lib/utils'

type Tone = 'primary' | 'success' | 'warning' | 'danger'

const toneColor: Record<Tone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

export function ProgressBar({
  value,
  tone = 'primary',
  className,
  height = 8,
}: {
  value: number
  tone?: Tone
  className?: string
  height?: number
}) {
  const pct = clampPct(value)
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-bg', className)}
      style={{ height }}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', toneColor[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
