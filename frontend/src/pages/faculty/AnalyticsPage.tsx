import { useQuery } from '@tanstack/react-query'
import { facultyApi } from '@/api/faculty'
import { PageShell } from '@/components/shared/PageShell'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton, StatCardSkeleton } from '@/components/ui/Skeleton'
import { TrendAreaChart, SimpleBarChart, DonutChart } from '@/components/charts'
import { AttendancePctCell } from '@/components/shared/AttendancePctCell'

export default function FacultyAnalyticsPage() {
  const att = useQuery({ queryKey: ['faculty', 'analytics-att'], queryFn: () => facultyApi.analyticsAttendance({}) })
  const marks = useQuery({ queryKey: ['faculty', 'analytics-marks'], queryFn: () => facultyApi.analyticsMarks({}) })
  const mentees = useQuery({ queryKey: ['faculty', 'analytics-mentees'], queryFn: facultyApi.analyticsMentees })

  const attData = att.data as { avgAttendance?: number; trend?: { labels: string[]; data: number[] }; bySubject?: { code: string; avgPct: number }[]; distribution?: { range: string; count: number }[] } | undefined
  const marksData = marks.data as { avgMarksPct?: number; passRate?: number; bySubject?: { code: string; avgMarksPct: number }[]; gradeDistribution?: { grade: string; count: number }[] } | undefined
  const menteesData = mentees.data as { totalMentees?: number; atRiskCount?: number; data?: { enrollmentNo: string; name: string; batchCode: string; avgAttendancePct: number; avgMarksPct: number; riskFactor: string }[] } | undefined

  return (
    <PageShell title="Analytics" subtitle="Insights across your subjects and mentees">
      <div className="mb-5 grid grid-cols-2 gap-3.5 md:grid-cols-4">
        {att.isLoading || marks.isLoading ? (
          <StatCardSkeleton count={4} />
        ) : (
          <>
            <StatCard value={`${Math.round(attData?.avgAttendance ?? 0)}%`} label="Avg Attendance" />
            <StatCard value={`${Math.round(marksData?.avgMarksPct ?? 0)}%`} label="Avg Marks" />
            <StatCard value={`${Math.round(marksData?.passRate ?? 0)}%`} label="Pass Rate" trend="up" />
            <StatCard value={menteesData?.atRiskCount ?? 0} label="At-Risk Mentees" trend="down" delta="Needs attention" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Attendance Trend" subtitle="Across your subjects" />
          <CardBody>
            {att.isLoading ? <CardSkeleton height={240} /> : attData?.trend ? (
              <TrendAreaChart labels={attData.trend.labels} data={attData.trend.data} />
            ) : <EmptyState title="No trend data" className="border-0" />}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Attendance by Subject" />
          <CardBody>
            {att.isLoading ? <CardSkeleton height={240} /> : attData?.bySubject && attData.bySubject.length > 0 ? (
              <SimpleBarChart data={attData.bySubject.map((s) => ({ label: s.code, value: s.avgPct }))} />
            ) : <EmptyState title="No data" className="border-0" />}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Marks by Subject" />
          <CardBody>
            {marks.isLoading ? <CardSkeleton height={240} /> : marksData?.bySubject && marksData.bySubject.length > 0 ? (
              <SimpleBarChart data={marksData.bySubject.map((s) => ({ label: s.code, value: s.avgMarksPct }))} color="#7C3AED" />
            ) : <EmptyState title="No marks data" className="border-0" />}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Grade Distribution" />
          <CardBody>
            {marks.isLoading ? <CardSkeleton height={240} /> : marksData?.gradeDistribution && marksData.gradeDistribution.length > 0 ? (
              <DonutChart data={marksData.gradeDistribution.map((g) => ({ label: g.grade, value: g.count }))} />
            ) : <EmptyState title="No grade data" className="border-0" />}
          </CardBody>
        </Card>
      </div>

      {menteesData?.data && menteesData.data.length > 0 && (
        <Card className="mt-4">
          <CardHeader title="Mentee Risk Snapshot" />
          <CardBody className="pt-0">
            <ul className="divide-y divide-border-light">
              {menteesData.data.slice(0, 8).map((m) => (
                <li key={m.enrollmentNo} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-[13px] font-semibold text-text-primary">{m.name}</div>
                    <div className="text-xs text-text-muted">{m.enrollmentNo} · {m.batchCode}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <AttendancePctCell pct={m.avgAttendancePct} showBar={false} />
                    <Badge tone={m.riskFactor === 'NONE' ? 'success' : 'danger'}>{m.riskFactor}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </PageShell>
  )
}
