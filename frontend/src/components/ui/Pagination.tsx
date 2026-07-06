import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPage,
}: {
  page: number
  totalPages: number
  total?: number
  limit?: number
  onPage: (page: number) => void
}) {
  if (totalPages <= 1 && !total) return null
  const from = total != null && limit != null ? (page - 1) * limit + 1 : null
  const to = total != null && limit != null ? Math.min(page * limit, total) : null

  return (
    <div className="flex items-center justify-between gap-4 px-1 py-3 text-[13px] text-text-secondary">
      <div>
        {total != null && from != null ? (
          <span>
            Showing <b className="text-text-primary">{from}</b>–
            <b className="text-text-primary">{to}</b> of{' '}
            <b className="text-text-primary">{total.toLocaleString('en-IN')}</b>
          </span>
        ) : (
          <span>
            Page {page} of {totalPages}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-sm border border-border',
            page <= 1 ? 'opacity-40' : 'hover:bg-surface-2',
          )}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-2 tabular-nums">
          {page} / {Math.max(totalPages, 1)}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-sm border border-border',
            page >= totalPages ? 'opacity-40' : 'hover:bg-surface-2',
          )}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
