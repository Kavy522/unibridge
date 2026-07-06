import { useQuery } from '@tanstack/react-query'
import { studentApi } from '@/api/student'

export function useStudentEnrollment() {
  return useQuery({
    queryKey: ['student', 'enrollment'],
    queryFn: studentApi.currentEnrollment,
    staleTime: 30 * 60 * 1000,
  })
}
