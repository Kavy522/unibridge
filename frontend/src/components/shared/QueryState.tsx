import { AlertTriangle } from 'lucide-react'
import type { UseQueryResult } from '@tanstack/react-query'
import { errorMessage } from '@/api/client'
import { FullPageSpinner } from '@/components/ui/Spinner'

/**
 * Renders loading / error fallbacks for a query, otherwise the children.
 * Pass a custom `loading` node to swap the spinner for a skeleton.
 */
export function QueryState<T>({
  query,
  loading,
  children,
}: {
  query: UseQueryResult<T>
  loading?: React.ReactNode
  children: (data: T) => React.ReactNode
}) {
  if (query.isLoading) return <>{loading ?? <FullPageSpinner />}</>
  if (query.isError)
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-danger/30 bg-danger-light/40 px-6 py-12 text-center">
        <AlertTriangle className="text-danger" size={22} />
        <p className="text-sm font-medium text-danger">{errorMessage(query.error)}</p>
        <button
          onClick={() => query.refetch()}
          className="mt-1 text-xs font-semibold text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    )
  if (query.data === undefined) return null
  return <>{children(query.data)}</>
}
