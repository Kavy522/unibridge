import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Search, Users } from 'lucide-react'
import { universityApi } from '@/api/university'
import { errorMessage } from '@/api/client'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Table, Th, Td, Tr } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'

export default function UniversityFacultyPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)

  const q = useQuery({ queryKey: ['uni', 'faculty', search, page], queryFn: () => universityApi.faculty({ search: search || undefined, page }) })
  const toggle = useMutation({
    mutationFn: (v: { id: string; isActive: boolean }) => universityApi.setFacultyActive(v.id, v.isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['uni', 'faculty'] }),
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <PageShell
      title="Faculty"
      subtitle={q.data ? `${q.data.total} faculty members` : 'All faculty in the university'}
      action={<Button leftIcon={<Plus size={15} />} onClick={() => setShowCreate(true)}>Add Faculty</Button>}
    >
      <div className="mb-4 max-w-xs">
        <Input leftIcon={<Search size={15} />} placeholder="Search name, email, employee ID…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      {q.isLoading ? (
        <CardSkeleton height={240} />
      ) : (q.data?.data ?? []).length === 0 ? (
        <EmptyState icon={<Users size={22} />} title="No faculty found" />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <thead><tr><Th>Employee ID</Th><Th>Name</Th><Th>Email</Th><Th>Department</Th><Th>Role</Th><Th>Status</Th><Th /></tr></thead>
            <tbody>
              {q.data?.data.map((f) => (
                <Tr key={f.id}>
                  <Td className="whitespace-nowrap">{f.employeeId}</Td>
                  <Td className="font-medium">{f.name}</Td>
                  <Td className="text-xs">{f.email}</Td>
                  <Td>{f.department}</Td>
                  <Td><Badge tone={f.isHod ? 'purple' : 'neutral'}>{f.isHod ? 'HOD' : 'Faculty'}</Badge></Td>
                  <Td><Badge tone={f.isActive ? 'success' : 'danger'}>{f.isActive ? 'Active' : 'Inactive'}</Badge></Td>
                  <Td>
                    <Button size="sm" variant="outline" onClick={() => toggle.mutate({ id: f.id, isActive: !f.isActive })}>
                      {f.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          {(q.data?.totalPages ?? 1) > 1 && (
            <div className="border-t border-border p-3">
              <Pagination page={page} totalPages={q.data?.totalPages ?? 1} total={q.data?.total} onPage={setPage} />
            </div>
          )}
        </Card>
      )}

      <CreateFacultyModal open={showCreate} onClose={() => setShowCreate(false)} onDone={() => qc.invalidateQueries({ queryKey: ['uni', 'faculty'] })} />
    </PageShell>
  )
}

function CreateFacultyModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ name: '', email: '', employeeId: '', department: '', password: '' })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }))
  const m = useMutation({
    mutationFn: () => universityApi.createFaculty({ ...f, role: 'FACULTY' }),
    onSuccess: () => { toast.success('Faculty created'); onDone(); onClose(); setF({ name: '', email: '', employeeId: '', department: '', password: '' }) },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const ready = Object.values(f).every(Boolean) && f.password.length >= 8
  return (
    <Modal open={open} onClose={onClose} title="Add Faculty"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => m.mutate()} loading={m.isPending} disabled={!ready}>Create</Button></>}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">Name *</label><Input value={f.name} onChange={set('name')} /></div>
          <div><label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">Employee ID *</label><Input value={f.employeeId} onChange={set('employeeId')} placeholder="EMP207" /></div>
        </div>
        <div><label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">Email *</label><Input type="email" value={f.email} onChange={set('email')} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">Department *</label><Input value={f.department} onChange={set('department')} placeholder="IT" /></div>
          <div><label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">Password * (min 8)</label><Input type="password" value={f.password} onChange={set('password')} /></div>
        </div>
      </div>
    </Modal>
  )
}
