import { useQuery } from '@tanstack/react-query'
import { HelpCircle, Play } from 'lucide-react'
import { studentApi } from '@/api/student'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'

export default function StudentQuizzesPage() {
  const list = useQuery({ queryKey: ['student', 'quizzes'], queryFn: () => studentApi.quizzes({ limit: 50 }) })
  const history = useQuery({ queryKey: ['student', 'quiz-history'], queryFn: studentApi.quizHistory })

  return (
    <PageShell title="Quizzes" subtitle={list.data ? `${list.data.total} available` : 'Take quizzes and see your scores'}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div>
          {list.isLoading ? <CardSkeleton height={200} /> : list.data && list.data.data.length === 0 ? (
            <EmptyState icon={<HelpCircle size={22} />} title="No quizzes available" description="Your faculty will publish quizzes here." />
          ) : (
            <div className="space-y-3">
              {list.data?.data.map((q) => (
                <Card key={q.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-text-primary">{q.title}</div>
                        {q.isAttempted && <Badge tone="success">Attempted</Badge>}
                      </div>
                      <div className="mt-0.5 text-xs text-text-muted">{q.subject.code} · {q.subject.name}</div>
                      {q.description && <p className="mt-1.5 line-clamp-2 text-xs text-text-secondary">{q.description}</p>}
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-text-secondary">
                        <span><b>{q.questionCount ?? 0}</b> Q</span>
                        {q.timeLimitMins && <span>{q.timeLimitMins} min</span>}
                        {q.dueDate && <span>Due {new Date(q.dueDate).toLocaleDateString('en-IN')}</span>}
                        {q.score != null && <span>Score: <b>{q.score}%</b></span>}
                      </div>
                    </div>
                    <Button
                      leftIcon={<Play size={14} />}
                      onClick={() => alert('Quiz attempt UI: to build separately.')}
                      disabled={q.isAttempted}
                    >
                      {q.isAttempted ? 'View' : 'Start'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card>
          <div className="border-b border-border p-4 text-sm font-semibold text-text-primary">My Attempts</div>
          <div className="p-4">
            {(history.data as { data?: { quizTitle: string; score: number; attemptedAt: string }[] })?.data?.length ? (
              <ul className="space-y-2">
                {(history.data as { data: { quizTitle: string; score: number; attemptedAt: string }[] }).data.map((h, i) => (
                  <li key={i} className="rounded-sm bg-surface-2 px-3 py-2 text-xs">
                    <div className="font-semibold text-text-primary">{h.quizTitle}</div>
                    <div className="text-text-muted">Score {h.score}% · {new Date(h.attemptedAt).toLocaleDateString('en-IN')}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-text-muted">No attempts yet.</p>
            )}
          </div>
        </Card>
      </div>
    </PageShell>
  )
}
