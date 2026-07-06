import { useQuery } from '@tanstack/react-query'
import { Trophy } from 'lucide-react'
import { studentApi } from '@/api/student'
import { PageShell } from '@/components/shared/PageShell'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

interface Entry { rank: number; enrollmentNo: string; name: string; batchCode: string; avgPct: number; isMe?: boolean }

export default function LeaderboardPage() {
  const list = useQuery({ queryKey: ['student', 'leaderboard'], queryFn: () => studentApi.leaderboard({ limit: 20 }) })
  const myRank = useQuery({ queryKey: ['student', 'my-rank'], queryFn: () => studentApi.myRank() })

  const entries = ((list.data as { data?: Entry[] })?.data ?? [])
  const me = myRank.data as { rank?: number; avgPct?: number; batchCode?: string } | undefined

  return (
    <PageShell title="Leaderboard" subtitle="See how you rank against your batch">
      {me && (
        <Card className="mb-4 border-primary bg-primary-light/40 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
              <Trophy size={20} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-primary">Your Rank</div>
              <div className="text-2xl font-bold text-text-primary">#{me.rank ?? '—'}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{Math.round(me.avgPct ?? 0)}%</div>
              <div className="text-xs text-text-muted">{me.batchCode ?? ''}</div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Top Students" />
        <CardBody className="pt-0">
          {list.isLoading ? <CardSkeleton height={200} /> : entries.length === 0 ? (
            <EmptyState icon={<Trophy size={22} />} title="No leaderboard data yet" className="border-0" />
          ) : (
            <ul className="space-y-1">
              {entries.map((e) => (
                <li key={e.enrollmentNo} className={cn('flex items-center gap-3 rounded-sm px-3 py-2.5', e.isMe && 'bg-primary-light')}>
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                    e.rank === 1 && 'bg-warning text-white',
                    e.rank === 2 && 'bg-slate-300 text-slate-800',
                    e.rank === 3 && 'bg-orange-300 text-orange-900',
                    e.rank > 3 && 'bg-surface-2 text-text-secondary',
                  )}>
                    {e.rank}
                  </div>
                  <Avatar name={e.name} size={34} />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-[13px] font-semibold text-text-primary">{e.name} {e.isMe && <Badge tone="primary" className="ml-1">You</Badge>}</div>
                    <div className="text-xs text-text-muted">{e.enrollmentNo} · {e.batchCode}</div>
                  </div>
                  <Badge tone={e.rank <= 3 ? 'success' : 'neutral'}>{Math.round(e.avgPct)}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </PageShell>
  )
}
