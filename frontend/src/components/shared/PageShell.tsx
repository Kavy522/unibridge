import { cn } from '@/lib/utils'

export interface PageShellProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function PageShell({ title, subtitle, action, children, className }: PageShellProps) {
  return (
    <div className={cn('mx-auto w-full max-w-[1400px]', className)}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}
