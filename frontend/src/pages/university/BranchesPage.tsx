import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { AlertTriangle, GitBranch, Plus, Trash2 } from 'lucide-react'
import { universityApi } from '@/api/university'
import { errorMessage } from '@/api/client'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'

interface BranchRow { id: string; code: string; name: string; studentCount: number }

export default function UniversityBranchesPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [deleteOf, setDeleteOf] = useState<BranchRow | null>(null)

  const q = useQuery({ queryKey: ['uni', 'branches'], queryFn: universityApi.branches })
  const refresh = () => qc.invalidateQueries({ queryKey: ['uni', 'branches'] })

  const del = useMutation({
    mutationFn: (id: string) => universityApi.deleteBranch(id),
    onSuccess: () => { toast.success('Branch deleted'); setDeleteOf(null); refresh() },
    onError: (e) => { toast.error(errorMessage(e)); setDeleteOf(null) },
  })

  return (
    <PageShell
      title="Branches"
      subtitle="Only these branches can exist in the university — student records are validated against this list"
      action={<Button leftIcon={<Plus size={15} />} onClick={() => setShowCreate(true)}>Add Branch</Button>}
    >
      {(q.data?.orphanBranches ?? []).length > 0 && (
        <Card className="mb-4 border-warning bg-warning-light/30 p-3.5">
          <div className="flex items-center gap-2 text-[13px] text-warning">
            <AlertTriangle size={15} />
            <span>
              Students exist with branches not in this list:{' '}
              {q.data?.orphanBranches.map((o) => `${o.branch} (${o.count})`).join(', ')}. Add those branches or correct the students.
            </span>
          </div>
        </Card>
      )}

      {q.isLoading ? (
        <CardSkeleton height={180} />
      ) : (q.data?.data ?? []).length === 0 ? (
        <EmptyState icon={<GitBranch size={22} />} title="No branches defined" description="Add the branches your university offers." action={<Button onClick={() => setShowCreate(true)}>Add Branch</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.data?.data.map((b) => (
            <Card key={b.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-text-primary">{b.code}</h3>
                    <Badge tone={b.studentCount > 0 ? 'primary' : 'neutral'}>{b.studentCount} students</Badge>
                  </div>
                  <div className="mt-0.5 text-xs text-text-muted">{b.name}</div>
                </div>
                <button
                  onClick={() => setDeleteOf(b)}
                  className="text-text-muted hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={b.studentCount > 0}
                  title={b.studentCount > 0 ? 'In use — cannot delete' : 'Delete branch'}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateBranchModal open={showCreate} onClose={() => setShowCreate(false)} onDone={refresh} />

      <ConfirmDialog
        open={!!deleteOf}
        title="Delete branch?"
        message={<>Delete <b>{deleteOf?.code}</b> ({deleteOf?.name})? New students can no longer use it.</>}
        destructive
        loading={del.isPending}
        onConfirm={() => deleteOf && del.mutate(deleteOf.id)}
        onCancel={() => setDeleteOf(null)}
      />
    </PageShell>
  )
}

function CreateBranchModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const m = useMutation({
    mutationFn: () => universityApi.createBranch({ code: code.trim().toUpperCase(), name: name.trim() }),
    onSuccess: () => { toast.success('Branch added'); onDone(); onClose(); setCode(''); setName('') },
    onError: (e) => toast.error(errorMessage(e)),
  })
  return (
    <Modal open={open} onClose={onClose} title="Add Branch"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => m.mutate()} loading={m.isPending} disabled={!code.trim() || !name.trim()}>Add</Button></>}>
      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">Code *</label>
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CSE" maxLength={10} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">Full Name *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Computer Science & Engineering" />
        </div>
      </div>
    </Modal>
  )
}
