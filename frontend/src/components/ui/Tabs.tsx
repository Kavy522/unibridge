import { cn } from '@/lib/utils'

export interface TabItem {
  key: string
  label: React.ReactNode
}

export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: TabItem[]
  value: string
  onChange: (key: string) => void
  className?: string
}) {
  return (
    <div className={cn('inline-flex gap-0.5 rounded-sm bg-bg p-1', className)}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            'whitespace-nowrap rounded-xs px-3.5 py-1.5 text-[13px] font-medium transition-all',
            value === t.key
              ? 'bg-surface text-primary shadow-card font-semibold'
              : 'text-text-secondary hover:text-text-primary',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
