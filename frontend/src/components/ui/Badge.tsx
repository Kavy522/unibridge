import { cn } from '@/lib/utils'

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'teal' | 'neutral'

const tones: Record<Tone, string> = {
  primary: 'bg-primary-light text-primary',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-danger-light text-danger',
  purple: 'bg-purple-light text-purple',
  teal: 'bg-teal-light text-teal',
  neutral: 'bg-surface-2 text-text-secondary',
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  dot?: boolean
}

export function Badge({ tone = 'neutral', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
