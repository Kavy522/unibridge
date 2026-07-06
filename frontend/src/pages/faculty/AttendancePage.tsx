import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CalendarCheck, Check, X } from 'lucide-react'
import { facultyApi } from '@/api/faculty'
import { errorMessage } from '@/api/client'
import { useFacultyScope } from '@/hooks/faculty/useFacultyScope'
import { PageShell } from '@/components/shared/PageShell'
import { FilterBar } from '@/components/shared/FilterBar'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/ui/Avatar'
import { StatCard } from '@/components/ui/StatCard'
import { Table, Td, Th, Tr } from '@/components/ui/Table'
import { TableSkeleton, StatCardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'

export default function FacultyAttendancePage() {
  const qc = useQueryClient()
  const scope = useFacultyScope()
  const summary = useQuery({ queryKey: ['faculty', 'attendance-summary'], queryFn: facultyApi.attendanceSummary })

  const [subjectId, setSubjectId] = useState('')
  const [batchId, setBatchId] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [marks, setMarks] = useState<Record<string, boolean>>({})

  const canLoadSession = subjectId && batchId && date

  const session = useQuery({
    queryKey: ['faculty', 'attendance-session', { subjectId, batchId, date }],
    queryFn: () => facultyApi.attendanceSession({ subjectId, batchId, lectureDate: date }),
    enabled: !!canLoadSession,
  })

  const subjectOpts = useMemo(() => {
    const seen = new Set<string>()
    const opts: { value: string; label: string }[] = []
    scope.data?.assignments.forEach((a) => {
      if (!seen.has(a.subject.id)) { seen.add(a.subject.id); opts.push({ value: a.subject.id, label: `${a.subject.code} — ${a.subject.name}` }) }
    })
    return opts
  }, [scope.data])

  const batchOpts = useMemo(() => {
    if (!subjectId) return []
    const seen = new Set<string>()
    return scope.data?.assignments
      .filter((a) => a.subject.id === subjectId)
      .filter((a) => !seen.has(a.batch.id) && seen.add(a.batch.id))
      .map((a) => ({ value: a.batch.id, label: `Batch ${a.batch.code}` })) ?? []
  }, [scope.data, subjectId])

  const post = useMutation({
    mutationFn: () => {
      const attendance = (session.data?.students ?? []).map((s) => ({
        enrollmentId: s.enrollmentId,
        isPresent: marks[s.enrollmentId] ?? false,
      }))
      return facultyApi.postAttendance({ subjectId, batchId, lectureDate: date, attendance })
    },
    onSuccess: (res: { recordsCreated?: number }) => {
      toast.success(`Attendance saved (${res.recordsCreated ?? 0} students)`)
      qc.invalidateQueries({ queryKey: ['faculty', 'attendance-session'] })
      qc.invalidateQueries({ queryKey: ['faculty', 'attendance-summary'] })
      setMarks({})
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  function markAll(value: boolean) {
    const m: Record<string, boolean> = {}
    session.data?.students.forEach((s) => (m[s.enrollmentId] = value))
    setMarks(m)
  }

  const marked = session.data?.students.filter((s) => marks[s.enrollmentId] != null).length ?? 0
  const total = session.data?.students.length ?? 0
  const presentCount = Object.values(marks).filter(Boolean).length

  return (
    <PageShell title="Attendance" subtitle="Mark and track student attendance">
      <div className="mb-5 grid grid-cols-2 gap-3.5 md:grid-cols-4">
        {summary.isLoading ? (
          <StatCardSkeleton count={4} />
        ) : summary.data ? (
          <>
            <StatCard value={`${Math.round(summary.data.overallAvgPct ?? 0)}%`} label="Overall Avg" icon={<CalendarCheck size={18} className="text-success" />} iconBg="var(--success-light)" />
            <StatCard value={summary.data.totalLectures ?? 0} label="Lectures Taken" />
            <StatCard value={summary.data.belowThresholdCount ?? 0} label="Below Threshold" delta="Needs attention" trend="down" />
            <StatCard value={summary.data.pendingLectures ?? 0} label="Pending" />
          </>
        ) : null}
      </div>

      <Card className="mb-4">
        <CardHeader title="Mark Attendance" subtitle="Choose subject, batch and date" />
        <CardBody>
          <FilterBar>
            <Select className="w-64" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setBatchId(''); setMarks({}) }} placeholder="Subject" options={subjectOpts} />
            <Select className="w-40" value={batchId} onChange={(e) => { setBatchId(e.target.value); setMarks({}) }} placeholder="Batch" options={batchOpts} disabled={!subjectId} />
            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setMarks({}) }} className="h-10 rounded-sm border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </FilterBar>

          {!canLoadSession ? (
            <EmptyState title="Pick a subject, batch and date" description="Then mark each student present or absent." className="border-0" />
          ) : session.isLoading ? (
            <TableSkeleton rows={8} cols={4} />
          ) : session.data && session.data.students.length === 0 ? (
            <EmptyState title="No students in this batch" className="border-0" />
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-sm bg-surface-2 px-3 py-2">
                <div className="text-xs text-text-secondary">
                  Marked <b>{marked}</b> / <b>{total}</b> · Present <b className="text-success">{presentCount}</b> · Absent <b className="text-danger">{marked - presentCount}</b>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => markAll(true)}>Mark All Present</Button>
                  <Button variant="outline" size="sm" onClick={() => markAll(false)}>Mark All Absent</Button>
                </div>
              </div>
              <Table>
                <thead>
                  <tr>
                    <Th>Student</Th>
                    <Th>Enrollment No.</Th>
                    <Th>Roll No.</Th>
                    <Th className="text-right">Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {session.data?.students.map((s) => {
                    const state = marks[s.enrollmentId]
                    return (
                      <Tr key={s.enrollmentId}>
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={s.name} size={30} />
                            <span className="font-medium">{s.name}</span>
                          </div>
                        </Td>
                        <Td className="font-mono text-xs text-text-secondary">{s.enrollmentNo}</Td>
                        <Td className="whitespace-nowrap text-text-secondary">{s.rollNo ?? '—'}</Td>
                        <Td>
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setMarks((m) => ({ ...m, [s.enrollmentId]: true }))} className={cn('flex h-8 w-8 items-center justify-center rounded-sm border transition', state === true ? 'bg-success text-white border-success' : 'border-border text-text-secondary hover:bg-success-light hover:text-success')} title="Present">
                              <Check size={16} />
                            </button>
                            <button onClick={() => setMarks((m) => ({ ...m, [s.enrollmentId]: false }))} className={cn('flex h-8 w-8 items-center justify-center rounded-sm border transition', state === false ? 'bg-danger text-white border-danger' : 'border-border text-text-secondary hover:bg-danger-light hover:text-danger')} title="Absent">
                              <X size={16} />
                            </button>
                          </div>
                        </Td>
                      </Tr>
                    )
                  })}
                </tbody>
              </Table>
              <div className="mt-4 flex justify-end">
                <Button onClick={() => post.mutate()} loading={post.isPending} disabled={marked === 0}>
                  Save Attendance ({marked} marked)
                </Button>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Below Threshold" subtitle="Students below 75% attendance in your subjects" />
        <CardBody className="pt-0">
          <BelowThresholdList />
        </CardBody>
      </Card>
    </PageShell>
  )
}

function BelowThresholdList() {
  const list = useQuery({ queryKey: ['faculty', 'below-threshold'], queryFn: () => facultyApi.belowThreshold({}) })
  if (list.isLoading) return <TableSkeleton rows={4} cols={4} />
  const rows = (list.data as { data?: { enrollmentNo: string; name: string; subjectCode?: string; attendancePct: number }[] })?.data ?? []
  if (rows.length === 0) return <EmptyState title="No at-risk students" description="Everyone is above threshold. 🎉" className="border-0" />
  return (
    <ul className="divide-y divide-border-light">
      {rows.map((r) => (
        <li key={r.enrollmentNo + (r.subjectCode ?? '')} className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2.5">
            <Avatar name={r.name} size={30} />
            <div>
              <div className="text-[13px] font-semibold text-text-primary">{r.name}</div>
              <div className="text-xs text-text-muted">{r.enrollmentNo} {r.subjectCode && `· ${r.subjectCode}`}</div>
            </div>
          </div>
          <Badge tone="danger">{Math.round(r.attendancePct)}%</Badge>
        </li>
      ))}
    </ul>
  )
}
