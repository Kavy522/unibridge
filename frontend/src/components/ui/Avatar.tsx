import { cn } from '@/lib/utils'
import { initials } from '@/lib/utils'

export interface AvatarProps {
  name?: string | null
  src?: string | null
  size?: number
  className?: string
}

export function Avatar({ name, src, size = 36, className }: AvatarProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light font-semibold text-primary',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src ? (
        <img src={src} alt={name ?? ''} className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  )
}
