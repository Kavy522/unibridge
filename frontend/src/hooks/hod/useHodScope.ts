import { useQuery } from '@tanstack/react-query'
import { hodApi } from '@/api/hod'

/**
 * Every HOD page that needs batch/subject context or the active semester calls this.
 * Returns owned batches, active semester, and headline counts.
 */
export function useHodScope(semesterId?: string) {
  return useQuery({
    queryKey: ['hod', 'scope', semesterId ?? 'active'],
    queryFn: () => hodApi.scope(semesterId),
    staleTime: 5 * 60 * 1000,
  })
}
