import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leftIcon, invalid, ...props },
  ref,
) {
  return (
    <div className="relative flex items-center">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3 text-text-muted">{leftIcon}</span>
      )}
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded-sm border bg-surface px-3 text-sm text-text-primary',
          'placeholder:text-text-muted transition-colors outline-none',
          'focus:border-primary focus:ring-4 focus:ring-primary/10',
          leftIcon && 'pl-10',
          invalid ? 'border-danger' : 'border-border',
          className,
        )}
        {...props}
      />
    </div>
  )
})
