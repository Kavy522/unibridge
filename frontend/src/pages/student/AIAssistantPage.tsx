import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Send, Sparkles, Trash2 } from 'lucide-react'
import { studentApi } from '@/api/student'
import { errorMessage } from '@/api/client'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

export default function AIAssistantPage() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const list = useQuery({ queryKey: ['student', 'ai-convs'], queryFn: studentApi.aiConversations })
  const conv = useQuery({
    queryKey: ['student', 'ai-conv', selectedId],
    queryFn: () => studentApi.aiConversation(selectedId!),
    enabled: !!selectedId,
  })

  const create = useMutation({
    mutationFn: () => studentApi.createAiConversation(`Chat ${new Date().toLocaleString('en-IN')}`),
    onSuccess: (c: { id: string }) => { setSelectedId(c.id); qc.invalidateQueries({ queryKey: ['student', 'ai-convs'] }) },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const send = useMutation({
    mutationFn: () => studentApi.sendAiMessage(selectedId!, text.trim()),
    onSuccess: () => { setText(''); qc.invalidateQueries({ queryKey: ['student', 'ai-conv', selectedId] }) },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const del = useMutation({
    mutationFn: (id: string) => studentApi.deleteAiConversation(id),
    onSuccess: () => {
      setSelectedId(null)
      qc.invalidateQueries({ queryKey: ['student', 'ai-convs'] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [conv.data?.messages.length])

  return (
    <PageShell title="AI Assistant" subtitle="Ask questions about your subjects">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="max-h-[560px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-3">
            <div className="text-sm font-semibold">Conversations</div>
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => create.mutate()} loading={create.isPending}>New</Button>
          </div>
          <div className="scrollbar-thin max-h-[500px] overflow-y-auto">
            {list.isLoading ? <div className="p-3"><CardSkeleton height={80} /></div> : list.data?.data.length === 0 ? (
              <p className="p-4 text-xs text-text-muted">No conversations yet.</p>
            ) : (
              <ul className="divide-y divide-border-light">
                {list.data?.data.map((c) => (
                  <li key={c.id} className={cn('group flex items-center gap-2 px-3 py-2 cursor-pointer transition hover:bg-surface-2', selectedId === c.id && 'bg-primary-light')}
                    onClick={() => setSelectedId(c.id)}>
                    <Sparkles size={14} className="text-purple" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-[13px] font-medium text-text-primary">{c.title}</div>
                      <div className="text-[10px] text-text-muted">{new Date(c.createdAt).toLocaleDateString('en-IN')}</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); del.mutate(c.id) }} className="opacity-0 transition group-hover:opacity-100 text-text-muted hover:text-danger">
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card className="flex h-[560px] flex-col">
          {!selectedId ? (
            <EmptyState icon={<Sparkles size={22} />} title="Start a conversation" description="Create a new chat to ask about any subject." action={<Button leftIcon={<Plus size={14} />} onClick={() => create.mutate()} loading={create.isPending}>New Chat</Button>} className="border-0 flex-1" />
          ) : (
            <>
              <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
                {conv.isLoading ? <CardSkeleton height={200} /> : conv.data?.messages.length === 0 ? (
                  <p className="mt-16 text-center text-xs text-text-muted">Ask anything about your subjects…</p>
                ) : (
                  <div className="space-y-3">
                    {conv.data?.messages.map((m) => (
                      <div key={m.id} className={cn('flex', m.role === 'USER' ? 'justify-end' : 'justify-start')}>
                        <div className={cn('max-w-[80%] rounded-sm px-3 py-2 text-[13px]', m.role === 'USER' ? 'bg-primary text-white' : 'bg-surface-2 text-text-primary')}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); if (text.trim()) send.mutate() }}
                className="flex items-center gap-2 border-t border-border p-3"
              >
                <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask a question…" />
                <Button type="submit" disabled={!text.trim()} loading={send.isPending} leftIcon={<Send size={14} />}>Send</Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </PageShell>
  )
}
