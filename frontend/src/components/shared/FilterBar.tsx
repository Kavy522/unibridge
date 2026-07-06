import { cn } from '@/lib/utils'

export function FilterBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-4 flex flex-wrap items-center gap-2.5', className)}>{children}</div>
}
