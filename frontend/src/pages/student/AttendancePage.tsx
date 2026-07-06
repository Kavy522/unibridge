import { useQuery } from '@tanstack/react-query'
import { studentApi } from '@/api/student'
import { useStudentEnrollment } from '@/hooks/student/useStudentEnrollment'
import { PageShell } from '@/components/shared/PageShell'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StatCardSkeleton, CardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { attendanceTone } from '@/lib/utils'

export default function StudentAttendancePage() {
  const enrollment = useStudentEnrollment()
  const att = useQuery({ queryKey: ['student', 'attendance-full'], queryFn: () => studentApi.attendance(enrollment.data?.semesterId), enabled: !!enrollment.data?.semesterId })

  const subjects = att.data?.subjects ?? []
  const avg = subjects.length ? Math.round(subjects.reduce((s, x) => s + x.percentage, 0) / subjects.length) : 0
  const belowCount = subjects.filter((s) => s.isBelowThreshold ?? s.percentage < 75).length
  const totalLectures = subjects.reduce((s, x) => s + x.totalLectures, 0)
  const attended = subjects.reduce((s, x) => s + x.attended, 0)

  return (
    <PageShell title="My Attendance" subtitle={enrollment.data ? enrollment.data.semesterLabel : 'Track your attendance'}>
      <div className="mb-5 grid grid-cols-2 gap-3.5 md:grid-cols-4">
        {att.isLoading ? <StatCardSkeleton count={4} /> : (
          <>
            <StatCard value={`${avg}%`} label="Overall" />
            <StatCard value={attended} label="Attended" />
            <StatCard value={totalLectures} label="Total Lectures" />
            <StatCard value={belowCount} label="Below 75%" trend={belowCount ? 'down' : 'neutral'} delta={belowCount ? 'Needs attention' : 'On track'} />
          </>
        )}
      </div>

      <Card>
        <CardHeader title="Per-Subject Attendance" />
        <CardBody className="pt-0">
          {att.isLoading ? <CardSkeleton height={200} /> : subjects.length === 0 ? (
            <EmptyState title="No attendance data" className="border-0" />
          ) : (
            <ul className="space-y-3">
              {subjects.map((s) => {
                const tone = attendanceTone(s.percentage)
                return (
                  <li key={s.subjectCode} className="rounded-sm border border-border p-3">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <div className="text-sm font-semibold text-text-primary">{s.subjectCode}</div>
                        {s.subjectName && <div className="text-xs text-text-muted">{s.subjectName}</div>}
                      </div>
                      <Badge tone={tone}>{Math.round(s.percentage)}%</Badge>
                    </div>
                    <ProgressBar value={s.percentage} tone={tone} />
                    <div className="mt-1.5 flex items-center justify-between text-xs text-text-secondary">
                      <span>{s.attended} attended · {s.totalLectures - s.attended} missed</span>
                      <span className="text-text-muted">out of {s.totalLectures} lectures</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </PageShell>
  )
}
