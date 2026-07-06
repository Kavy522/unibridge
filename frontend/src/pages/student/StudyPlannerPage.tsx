import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Sparkles, Target } from 'lucide-react'
import { studentApi } from '@/api/student'
import { errorMessage } from '@/api/client'
import { PageShell } from '@/components/shared/PageShell'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'

interface Session { time?: string; subject: string; topic: string; durationMins?: number; isCompleted?: boolean }
interface DayPlan { date: string; sessions: Session[] }

export default function StudyPlannerPage() {
  const [plan, setPlan] = useState<DayPlan[]>([])
  const saved = useQuery({ queryKey: ['student', 'planner'], queryFn: studentApi.studyPlanner })

  useEffect(() => {
    const p = (saved.data as { plan?: DayPlan[] })?.plan
    if (p) setPlan(p)
  }, [saved.data])

  const save = useMutation({
    mutationFn: () => studentApi.saveStudyPlanner(plan as unknown[]),
    onSuccess: () => toast.success('Plan saved'),
    onError: (e) => toast.error(errorMessage(e)),
  })

  function addDay() {
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + plan.length)
    setPlan((p) => [...p, { date: nextDate.toISOString().slice(0, 10), sessions: [{ subject: '', topic: '', durationMins: 60 }] }])
  }

  function addSession(di: number) {
    setPlan((p) => p.map((d, i) => i === di ? { ...d, sessions: [...d.sessions, { subject: '', topic: '', durationMins: 60 }] } : d))
  }

  function updateSession(di: number, si: number, patch: Partial<Session>) {
    setPlan((p) => p.map((d, i) => i === di ? { ...d, sessions: d.sessions.map((s, j) => j === si ? { ...s, ...patch } : s) } : d))
  }

  function toggleSession(di: number, si: number) {
    updateSession(di, si, { isCompleted: !plan[di].sessions[si].isCompleted })
  }

  function removeSession(di: number, si: number) {
    setPlan((p) => p.map((d, i) => i === di ? { ...d, sessions: d.sessions.filter((_, j) => j !== si) } : d))
  }

  return (
    <PageShell
      title="Study Planner"
      subtitle="Plan your study sessions week by week"
      action={
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Sparkles size={15} />} onClick={() => toast('AI suggestions: coming soon')}>AI Suggest</Button>
          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={plan.length === 0}>Save Plan</Button>
        </div>
      }
    >
      {plan.length === 0 ? (
        <EmptyState icon={<Target size={22} />} title="No plan yet" description="Add days and sessions to organize your study." action={<Button onClick={addDay}>Add Day</Button>} />
      ) : (
        <div className="space-y-4">
          {plan.map((day, di) => {
            const done = day.sessions.filter((s) => s.isCompleted).length
            return (
              <Card key={di}>
                <CardHeader
                  title={new Date(day.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                  subtitle={`${done}/${day.sessions.length} sessions completed`}
                  action={<Button variant="ghost" size="sm" onClick={() => addSession(di)}>+ Session</Button>}
                />
                <CardBody className="pt-0 space-y-2">
                  {day.sessions.map((s, si) => (
                    <div key={si} className={`flex flex-wrap items-center gap-2 rounded-sm border border-border p-2 ${s.isCompleted ? 'bg-success-light/40' : ''}`}>
                      <input type="checkbox" checked={s.isCompleted ?? false} onChange={() => toggleSession(di, si)} className="h-4 w-4 accent-primary" />
                      <Input className="max-w-32" value={s.subject} onChange={(e) => updateSession(di, si, { subject: e.target.value })} placeholder="Subject" />
                      <Input className="flex-1 min-w-40" value={s.topic} onChange={(e) => updateSession(di, si, { topic: e.target.value })} placeholder="Topic" />
                      <Input className="max-w-24" type="number" value={s.durationMins ?? ''} onChange={(e) => updateSession(di, si, { durationMins: Number(e.target.value) })} placeholder="Mins" />
                      <button onClick={() => removeSession(di, si)} className="text-xs text-text-muted hover:text-danger">Remove</button>
                    </div>
                  ))}
                </CardBody>
              </Card>
            )
          })}
          <div className="flex justify-center">
            <Button variant="outline" onClick={addDay}>+ Add Day</Button>
          </div>
        </div>
      )}
      {saved.data && plan.length > 0 && (
        <Badge tone="neutral" className="mt-3">
          {(saved.data as { updatedAt?: string }).updatedAt ? `Last saved ${new Date((saved.data as { updatedAt: string }).updatedAt).toLocaleString('en-IN')}` : 'Not saved yet'}
        </Badge>
      )}
    </PageShell>
  )
}
