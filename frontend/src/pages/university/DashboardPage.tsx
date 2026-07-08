import { useQuery } from '@tanstack/react-query'
import { Building2, CalendarRange, GraduationCap, UserCheck, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { universityApi } from '@/api/university'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

export default function UniversityDashboardPage() {
  const q = useQuery({ queryKey: ['uni', 'overview'], queryFn: universityApi.overview })
  const d = q.data

  if (q.isLoading) return <PageShell title="University Dashboard"><CardSkeleton height={300} /></PageShell>

  const maxBranch = Math.max(1, ...(d?.branchBreakdown.map((b) => b.count) ?? [1]))

  return (
    <PageShell
      title={d?.university.name ?? 'University Dashboard'}
      subtitle={
        d?.activeYear
          ? `Active: ${d.activeYear.label} · ${d.activeSemester?.label ?? 'no active semester'}`
          : 'No active academic year'
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard value={d?.counts.students ?? 0} label="Total Students" icon={<GraduationCap size={18} />} />
        <StatCard value={d?.counts.faculty ?? 0} label="Faculty" icon={<Users size={18} />} />
        <StatCard value={d?.counts.hods ?? 0} label="HODs" icon={<UserCheck size={18} />} />
        <StatCard value={d?.counts.batches ?? 0} label="Batches (active year)" icon={<CalendarRange size={18} />} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Students by Branch</h3>
          {(d?.branchBreakdown ?? []).length === 0 ? (
            <EmptyState icon={<Building2 size={20} />} title="No students yet" />
          ) : (
            <div className="space-y-3">
              {d?.branchBreakdown.map((b) => (
                <div key={b.branch}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-text-primary">{b.branch}</span>
                    <span className="text-text-muted">{b.count}</span>
                  </div>
                  <ProgressBar value={(b.count / maxBranch) * 100} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Recent Activity</h3>
          {(d?.recentActivity ?? []).length === 0 ? (
            <EmptyState icon={<CalendarRange size={20} />} title="No activity yet" />
          ) : (
            <div className="space-y-3">
              {d?.recentActivity.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-3 border-b border-border-light pb-2.5 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-text-primary">{a.title}</div>
                    <div className="truncate text-xs text-text-muted">{a.by} · {a.description}</div>
                  </div>
                  <Badge tone="neutral">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  )
}
