import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text-primary',
        'placeholder:text-text-muted outline-none transition-colors resize-y min-h-[80px]',
        'focus:border-primary focus:ring-4 focus:ring-primary/10',
        className,
      )}
      {...props}
    />
  )
})
