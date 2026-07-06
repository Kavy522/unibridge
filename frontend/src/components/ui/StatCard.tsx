import { cn } from '@/lib/utils'
import { Card } from './Card'

type Trend = 'up' | 'down' | 'neutral'

export interface StatCardProps {
  value: React.ReactNode
  label: string
  icon?: React.ReactNode
  iconBg?: string
  delta?: string
  trend?: Trend
  className?: string
}

const trendClass: Record<Trend, string> = {
  up: 'text-success',
  down: 'text-danger',
  neutral: 'text-text-muted',
}

const trendGlyph: Record<Trend, string> = { up: '↑', down: '↓', neutral: '—' }

export function StatCard({ value, label, icon, iconBg, delta, trend = 'neutral', className }: StatCardProps) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-bold text-text-primary">{value}</div>
          <div className="mt-0.5 text-xs font-medium text-text-secondary">{label}</div>
        </div>
        {icon && (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-sm"
            style={{ background: iconBg ?? 'var(--primary-light)' }}
          >
            {icon}
          </div>
        )}
      </div>
      {delta && (
        <div className={cn('mt-3 text-xs font-medium', trendClass[trend])}>
          {trendGlyph[trend]} {delta}
        </div>
      )}
    </Card>
  )
}
