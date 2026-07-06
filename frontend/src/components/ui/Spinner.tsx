import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={cn('animate-spin text-primary', className)} />
}

export function FullPageSpinner() {
  return (
    <div className="flex h-full min-h-[60vh] w-full items-center justify-center">
      <Spinner size={28} />
    </div>
  )
}
