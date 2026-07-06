import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { MessageCircle, Send } from 'lucide-react'
import { facultyApi } from '@/api/faculty'
import { errorMessage } from '@/api/client'
import { useUser } from '@/stores/authStore'
import type { MenteeRow } from '@/types/faculty'
import { PageShell } from '@/components/shared/PageShell'
import { AttendancePctCell } from '@/components/shared/AttendancePctCell'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

const statusTone = { ACTIVE: 'success', AT_RISK: 'danger', INACTIVE: 'neutral' } as const

export default function MenteesPage() {
  const [selected, setSelected] = useState<MenteeRow | null>(null)
  const list = useQuery({ queryKey: ['faculty', 'mentees'], queryFn: () => facultyApi.mentees({ page: 1, limit: 100 }) })

  return (
    <PageShell
      title="Mentees"
      subtitle={list.data ? `${list.data.total} mentees · Mentor code ${list.data.mentorCode}` : 'Your assigned mentees'}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
        <Card className="max-h-[720px] overflow-hidden">
          <CardHeader title="My Mentees" />
          <div className="scrollbar-thin max-h-[640px] overflow-y-auto">
            {list.isLoading ? (
              <div className="p-4"><CardSkeleton height={100} /></div>
            ) : list.data && list.data.data.length === 0 ? (
              <EmptyState title="No mentees assigned" className="border-0" />
            ) : (
              <ul className="divide-y divide-border-light">
                {list.data?.data.map((m) => (
                  <li
                    key={m.mentorAssignmentId}
                    onClick={() => setSelected(m)}
                    className={cn('cursor-pointer px-4 py-3 transition hover:bg-surface-2', selected?.mentorAssignmentId === m.mentorAssignmentId && 'bg-primary-light')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar name={m.name} size={34} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[13px] font-semibold text-text-primary">{m.name}</span>
                          {m.unreadMessages && m.unreadMessages > 0 ? (
                            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{m.unreadMessages}</span>
                          ) : null}
                        </div>
                        <div className="truncate text-xs text-text-muted">{m.enrollmentNo} · {m.batchCode}</div>
                      </div>
                      <Badge tone={statusTone[m.status as keyof typeof statusTone] ?? 'neutral'}>{m.status}</Badge>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 pl-11 text-[11px] text-text-secondary">
                      <span>Att: <b>{Math.round(m.attendancePct ?? 0)}%</b></span>
                      {m.latestMarksPct != null && <span>Marks: <b>{Math.round(m.latestMarksPct)}%</b></span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          {selected ? (
            <MenteeDetail mentee={selected} />
          ) : (
            <EmptyState icon={<MessageCircle size={22} />} title="Pick a mentee" description="Select from the list to view their profile and chat." className="border-0 min-h-[400px]" />
          )}
        </Card>
      </div>
    </PageShell>
  )
}

function MenteeDetail({ mentee }: { mentee: MenteeRow }) {
  const profile = useQuery({ queryKey: ['faculty', 'mentee', mentee.enrollmentNo], queryFn: () => facultyApi.menteeProfile(mentee.enrollmentNo) })
  return (
    <>
      <CardHeader
        title={mentee.name}
        subtitle={`${mentee.enrollmentNo} · Batch ${mentee.batchCode}`}
      />
      <CardBody className="pt-0">
        <div className="mb-4 grid grid-cols-3 gap-3 rounded-sm bg-surface-2 p-3">
          <Stat label="Attendance"><AttendancePctCell pct={mentee.attendancePct} /></Stat>
          <Stat label="Latest Marks"><span className="text-sm font-semibold text-text-primary">{mentee.latestMarksPct != null ? `${Math.round(mentee.latestMarksPct)}%` : '—'}</span></Stat>
          <Stat label="Status"><Badge tone={statusTone[mentee.status as keyof typeof statusTone] ?? 'neutral'}>{mentee.status}</Badge></Stat>
        </div>
        {profile.data?.subjectBreakdown && (
          <div className="mb-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Per-subject Attendance</div>
            <div className="space-y-1.5">
              {(profile.data.subjectBreakdown as { subjectCode: string; attendancePct: number }[]).map((s) => (
                <div key={s.subjectCode} className="flex items-center justify-between rounded-sm bg-surface-2 px-3 py-1.5 text-xs">
                  <span className="font-medium">{s.subjectCode}</span>
                  <AttendancePctCell pct={s.attendancePct} />
                </div>
              ))}
            </div>
          </div>
        )}
        <ChatBox mentorAssignmentId={mentee.mentorAssignmentId} partnerName={mentee.name} />
      </CardBody>
    </>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</div>
      {children}
    </div>
  )
}

function ChatBox({ mentorAssignmentId, partnerName }: { mentorAssignmentId: string; partnerName: string }) {
  const qc = useQueryClient()
  const user = useUser()
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const messages = useQuery({
    queryKey: ['faculty', 'chat', mentorAssignmentId],
    queryFn: () => facultyApi.chatMessages(mentorAssignmentId, { limit: 50 }),
    // ponytail: poll every 5s instead of wiring socket.io; upgrade when real-time matters
    refetchInterval: 5000,
  })

  const send = useMutation({
    mutationFn: () => facultyApi.sendChat(mentorAssignmentId, text.trim()),
    onSuccess: () => { setText(''); qc.invalidateQueries({ queryKey: ['faculty', 'chat', mentorAssignmentId] }) },
    onError: (e) => toast.error(errorMessage(e)),
  })

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.data?.data.length])

  return (
    <div className="rounded-sm border border-border">
      <div className="border-b border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-text-secondary">Chat with {partnerName}</div>
      <div className="scrollbar-thin h-64 overflow-y-auto p-3">
        {(messages.data?.data ?? []).length === 0 ? (
          <p className="text-center text-xs text-text-muted">No messages yet — say hi.</p>
        ) : (
          <div className="space-y-2">
            {messages.data?.data.map((m) => {
              const isMine = m.senderRole === 'FACULTY'
              return (
                <div key={m.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[75%] rounded-sm px-3 py-1.5', isMine ? 'bg-primary text-white' : 'bg-surface-2 text-text-primary')}>
                    <div className="text-[13px]">{m.content}</div>
                    <div className={cn('mt-0.5 text-[10px]', isMine ? 'text-white/70' : 'text-text-muted')}>
                      {formatDistanceToNow(new Date(m.sentAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); if (text.trim()) send.mutate() }}
        className="flex items-center gap-2 border-t border-border p-2"
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message ${user?.name?.split(' ')[0] ?? ''}…`} />
        <Button type="submit" disabled={!text.trim()} loading={send.isPending} leftIcon={<Send size={14} />}>Send</Button>
      </form>
    </div>
  )
}
