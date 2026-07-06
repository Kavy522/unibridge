import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react'
import { hodApi } from '@/api/hod'
import { errorMessage } from '@/api/client'
import { useHodScope } from '@/hooks/hod/useHodScope'
import { useDebounce } from '@/hooks/shared/useDebounce'
import type { SubjectRow } from '@/types/hod'
import { PageShell } from '@/components/shared/PageShell'
import { FilterBar } from '@/components/shared/FilterBar'
import { SearchInput } from '@/components/shared/SearchInput'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { Table, Td, Th, Tr } from '@/components/ui/Table'
import { TableSkeleton, StatCardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SubjectFormModal } from './subjects/SubjectFormModal'

export default function SubjectsPage() {
  const qc = useQueryClient()
  const scope = useHodScope()
  const semesterId = scope.data?.activeSemester.id

  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [editing, setEditing] = useState<SubjectRow | 'new' | null>(null)
  const [deleteOf, setDeleteOf] = useState<SubjectRow | null>(null)

  const debouncedSearch = useDebounce(search)
  const filters = useMemo(
    () => ({ semesterId, search: debouncedSearch || undefined, type: type || undefined }),
    [semesterId, debouncedSearch, type],
  )

  const list = useQuery({
    queryKey: ['hod', 'subjects', filters],
    queryFn: () => hodApi.subjects.list(filters),
    enabled: !!semesterId,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['hod', 'subjects'] })

  const del = useMutation({
    mutationFn: (id: string) => hodApi.subjects.remove(id),
    onSuccess: () => { toast.success('Subject deleted'); invalidate(); setDeleteOf(null) },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const summary = list.data?.summary

  return (
    <PageShell
      title="Subjects"
      subtitle={scope.data ? `${scope.data.activeSemester.label}` : 'Manage subjects & assignments'}
      action={
        <Button leftIcon={<Plus size={15} />} onClick={() => setEditing('new')}>Add Subject</Button>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-3.5 md:grid-cols-4">
        {list.isLoading ? (
          <StatCardSkeleton count={4} />
        ) : summary ? (
          <>
            <StatCard value={summary.totalSubjects} label="Total Subjects" icon={<BookOpen size={18} className="text-primary" />} iconBg="var(--primary-light)" />
            <StatCard value={summary.totalCredits} label="Total Credits" icon={<BookOpen size={18} className="text-teal" />} iconBg="var(--teal-light)" />
            <StatCard value={summary.assignedCount} label="Assigned" icon={<BookOpen size={18} className="text-success" />} iconBg="var(--success-light)" />
            <StatCard value={summary.unassignedCount} label="Unassigned" icon={<BookOpen size={18} className="text-warning" />} iconBg="var(--warning-light)" />
          </>
        ) : null}
      </div>

      <FilterBar>
        <div className="w-64 max-w-full">
          <SearchInput value={search} onChange={setSearch} placeholder="Search subjects" />
        </div>
        <Select className="w-40" value={type} onChange={(e) => setType(e.target.value)} placeholder="All Types">
          <option value="Theory">Theory</option>
          <option value="Practical">Practical</option>
          <option value="Lab">Lab</option>
        </Select>
      </FilterBar>

      <Card className="overflow-hidden">
        {list.isLoading ? (
          <div className="p-4"><TableSkeleton rows={6} cols={6} /></div>
        ) : list.data && list.data.data.length === 0 ? (
          <EmptyState title="No subjects" description="Add a subject to get started." className="border-0" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Subject Name</Th>
                <Th>Credits</Th>
                <Th>Type</Th>
                <Th>Faculty</Th>
                <Th>Batches</Th>
                <Th>PYQ</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {list.data?.data.map((s) => (
                <Tr key={s.id}>
                  <Td className="font-semibold">{s.code}</Td>
                  <Td>{s.name}</Td>
                  <Td className="tabular-nums">{s.credits}</Td>
                  <Td><Badge tone="neutral">{s.type}</Badge></Td>
                  <Td>{s.assignedFaculty?.name ?? <span className="text-warning">Unassigned</span>}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {s.batches.map((b) => <Badge key={b} tone="primary">{b}</Badge>)}
                    </div>
                  </Td>
                  <Td>{s.pyqUploaded ? <Badge tone="success">Uploaded</Badge> : <span className="text-text-muted">—</span>}</Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditing(s)} className="flex h-8 w-8 items-center justify-center rounded-sm text-text-secondary hover:bg-primary-light hover:text-primary" title="Edit">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteOf(s)} className="flex h-8 w-8 items-center justify-center rounded-sm text-text-secondary hover:bg-danger-light hover:text-danger" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {editing && semesterId && (
        <SubjectFormModal
          semesterId={semesterId}
          subject={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={invalidate}
        />
      )}

      <ConfirmDialog
        open={!!deleteOf}
        title="Delete subject?"
        message={<>Delete <b>{deleteOf?.code}</b>? Blocked if it has results or attendance recorded.</>}
        destructive
        confirmLabel="Delete"
        loading={del.isPending}
        onConfirm={() => deleteOf && del.mutate(deleteOf.id)}
        onCancel={() => setDeleteOf(null)}
      />
    </PageShell>
  )
}
