import { useQuery } from '@tanstack/react-query'
import { facultyApi } from '@/api/faculty'

/** Faculty scope: active semester, assignments, mentor code. Every faculty page needs this. */
export function useFacultyScope() {
  return useQuery({
    queryKey: ['faculty', 'scope'],
    queryFn: () => facultyApi.scope(),
    staleTime: 5 * 60 * 1000,
  })
}
