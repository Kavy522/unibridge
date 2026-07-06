import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { hodApi } from '@/api/hod'
import { errorMessage } from '@/api/client'
import { useHodScope } from '@/hooks/hod/useHodScope'
import type { SubjectRow } from '@/types/hod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils'

const TYPES = ['Theory', 'Practical', 'Lab', 'Tutorial']

export function SubjectFormModal({
  semesterId,
  subject,
  onClose,
  onSaved,
}: {
  semesterId: string
  subject: SubjectRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const scope = useHodScope()
  const isEdit = !!subject
  const [form, setForm] = useState({
    code: subject?.code ?? '',
    name: subject?.name ?? '',
    credits: subject?.credits ?? 4,
    type: subject?.type ?? 'Theory',
    facultyId: subject?.assignedFaculty?.id ?? '',
  })
  const [batchIds, setBatchIds] = useState<string[]>([])

  const faculty = useQuery({
    queryKey: ['hod', 'faculty', 'picker'],
    queryFn: () => hodApi.faculty.list({ limit: 100 }),
  })

  const save = useMutation({
    mutationFn: () => {
      if (isEdit && subject) {
        return hodApi.subjects.update(subject.id, {
          code: form.code, name: form.name, credits: Number(form.credits), type: form.type,
        })
      }
      return hodApi.subjects.create({
        semesterId, code: form.code, name: form.name, credits: Number(form.credits),
        type: form.type, facultyId: form.facultyId || undefined, batchIds,
      })
    },
    onSuccess: () => { toast.success(isEdit ? 'Subject updated' : 'Subject added'); onSaved(); onClose() },
    onError: (e) => toast.error(errorMessage(e)),
  })

  function toggleBatch(id: string) {
    setBatchIds((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]))
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit Subject' : 'Add Subject'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!form.code || !form.name}>
            {isEdit ? 'Save' : 'Add'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="Code *"><Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} /></Labeled>
          <Labeled label="Credits"><Input type="number" value={form.credits} onChange={(e) => setForm((f) => ({ ...f, credits: Number(e.target.value) }))} /></Labeled>
        </div>
        <Labeled label="Subject Name *"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Labeled>
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="Type">
            <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} options={TYPES.map((t) => ({ value: t, label: t }))} />
          </Labeled>
          <Labeled label="Faculty">
            <Select
              value={form.facultyId}
              onChange={(e) => setForm((f) => ({ ...f, facultyId: e.target.value }))}
              placeholder="Unassigned"
              options={faculty.data?.data.map((fac) => ({ value: fac.id, label: fac.name })) ?? []}
            />
          </Labeled>
        </div>

        {!isEdit && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary">Batches</label>
            <div className="flex flex-wrap gap-2">
              {scope.data?.batches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => toggleBatch(b.id)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    batchIds.includes(b.id)
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-2',
                  )}
                >
                  {b.code}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</label>
      {children}
    </div>
  )
}
