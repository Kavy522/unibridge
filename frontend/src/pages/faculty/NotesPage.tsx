import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FileText, Plus, Trash2 } from 'lucide-react'
import { facultyApi } from '@/api/faculty'
import { errorMessage } from '@/api/client'
import { useFacultyScope } from '@/hooks/faculty/useFacultyScope'
import type { FacultyNote } from '@/types/faculty'
import { PageShell } from '@/components/shared/PageShell'
import { FileDrop } from '@/components/shared/FileDrop'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { formatDistanceToNow } from 'date-fns'

export default function NotesPage() {
  const qc = useQueryClient()
  const scope = useFacultyScope()
  const [page, setPage] = useState(1)
  const [showUpload, setShowUpload] = useState(false)
  const [deleteOf, setDeleteOf] = useState<FacultyNote | null>(null)

  const list = useQuery({ queryKey: ['faculty', 'notes', page], queryFn: () => facultyApi.notes({ page, limit: 20 }) })
  const del = useMutation({
    mutationFn: (id: string) => facultyApi.deleteNote(id),
    onSuccess: () => { toast.success('Note deleted'); qc.invalidateQueries({ queryKey: ['faculty', 'notes'] }); setDeleteOf(null) },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const subjectOpts = useMemo(() => {
    const seen = new Set<string>()
    return scope.data?.assignments
      .filter((a) => !seen.has(a.subject.id) && seen.add(a.subject.id))
      .map((a) => ({ value: a.subject.id, label: `${a.subject.code} — ${a.subject.name}` })) ?? []
  }, [scope.data])

  return (
    <PageShell
      title="Notes"
      subtitle={list.data ? `${list.data.total} notes uploaded` : 'Upload PDFs and study materials'}
      action={<Button leftIcon={<Plus size={15} />} onClick={() => setShowUpload(true)}>Upload Note</Button>}
    >
      {list.isLoading ? (
        <CardSkeleton height={200} />
      ) : list.data && list.data.data.length === 0 ? (
        <EmptyState icon={<FileText size={22} />} title="No notes yet" description="Upload your first PDF or document." action={<Button onClick={() => setShowUpload(true)}>Upload Note</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {list.data?.data.map((n) => (
            <Card key={n.id} className="p-4">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary-light text-primary">
                  <FileText size={18} />
                </div>
                <button onClick={() => setDeleteOf(n)} className="text-text-muted hover:text-danger" title="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="text-sm font-semibold text-text-primary line-clamp-2">{n.title}</div>
              <div className="mt-0.5 text-xs text-text-muted">{n.subject.code} · {n.subject.name}</div>
              {n.description && <p className="mt-2 line-clamp-2 text-xs text-text-secondary">{n.description}</p>}
              <div className="mt-3 flex items-center justify-between">
                <Badge tone="neutral">{n.fileType ?? 'PDF'}</Badge>
                <span className="text-[11px] text-text-muted">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {list.data && list.data.totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm" disabled={page >= list.data.totalPages} onClick={() => setPage((p) => p + 1)}>Load more</Button>
        </div>
      )}

      <UploadNoteModal open={showUpload} onClose={() => setShowUpload(false)} subjectOpts={subjectOpts} onSuccess={() => qc.invalidateQueries({ queryKey: ['faculty', 'notes'] })} />

      <ConfirmDialog
        open={!!deleteOf}
        title="Delete note?"
        message={<>Delete <b>{deleteOf?.title}</b>? This can't be undone.</>}
        destructive
        loading={del.isPending}
        onConfirm={() => deleteOf && del.mutate(deleteOf.id)}
        onCancel={() => setDeleteOf(null)}
      />
    </PageShell>
  )
}

function UploadNoteModal({ open, onClose, subjectOpts, onSuccess }: { open: boolean; onClose: () => void; subjectOpts: { value: string; label: string }[]; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState('')

  const upload = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('file', file!)
      fd.append('title', title)
      fd.append('description', description)
      fd.append('subjectId', subjectId)
      return facultyApi.uploadNote(fd)
    },
    onSuccess: () => { toast.success('Note uploaded'); onSuccess(); close() },
    onError: (e) => toast.error(errorMessage(e)),
  })

  function close() { setFile(null); setTitle(''); setDescription(''); setSubjectId(''); onClose() }

  return (
    <Modal
      open={open} onClose={close} title="Upload Note"
      footer={
        <>
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button onClick={() => upload.mutate()} loading={upload.isPending} disabled={!file || !title || !subjectId}>Upload</Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">Subject *</label>
          <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} placeholder="Select subject" options={subjectOpts} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">Title *</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chapter 1 — Introduction" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
        </div>
        <FileDrop accept=".pdf,.docx,.pptx" maxSizeMb={20} onFile={setFile} selectedName={file?.name} />
      </div>
    </Modal>
  )
}
