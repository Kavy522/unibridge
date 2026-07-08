import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CalendarRange, CheckCircle2, Plus } from 'lucide-react'
import { universityApi, type UniYear } from '@/api/university'
import { errorMessage } from '@/api/client'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'

const YEAR_TONE = { ACTIVE: 'success', DRAFT: 'warning', ARCHIVED: 'neutral' } as const
const SEM_TONE = { ACTIVE: 'success', UPCOMING: 'warning', COMPLETE: 'neutral' } as const

export default function UniversityYearsPage() {
  const qc = useQueryClient()
  const [showYear, setShowYear] = useState(false)
  const [semFor, setSemFor] = useState<UniYear | null>(null)
  const [batchFor, setBatchFor] = useState<UniYear | null>(null)

  const q = useQuery({ queryKey: ['uni', 'years'], queryFn: universityApi.years })
  const refresh = () => qc.invalidateQueries({ queryKey: ['uni'] })

  const activateYear = useMutation({
    mutationFn: (id: string) => universityApi.activateYear(id),
    onSuccess: () => { toast.success('Academic year activated'); refresh() },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const activateSem = useMutation({
    mutationFn: (id: string) => universityApi.activateSemester(id),
    onSuccess: () => { toast.success('Semester activated'); refresh() },
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <PageShell
      title="Academic Years"
      subtitle="Years, semesters and batches"
      action={<Button leftIcon={<Plus size={15} />} onClick={() => setShowYear(true)}>New Year</Button>}
    >
      {q.isLoading ? (
        <CardSkeleton height={240} />
      ) : (q.data?.data ?? []).length === 0 ? (
        <EmptyState icon={<CalendarRange size={22} />} title="No academic years" description="Create the first academic year." action={<Button onClick={() => setShowYear(true)}>New Year</Button>} />
      ) : (
        <div className="space-y-4">
          {q.data?.data.map((y) => (
            <Card key={y.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-text-primary">{y.label}</h3>
                  <Badge tone={YEAR_TONE[y.status]}>{y.status}</Badge>
                </div>
                <div className="flex gap-2">
                  {y.status !== 'ACTIVE' && (
                    <Button size="sm" variant="outline" leftIcon={<CheckCircle2 size={14} />} onClick={() => activateYear.mutate(y.id)} loading={activateYear.isPending}>
                      Set Active
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setSemFor(y)}>+ Semester</Button>
                  <Button size="sm" variant="outline" onClick={() => setBatchFor(y)}>+ Batch</Button>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase text-text-muted">Semesters</div>
                  {y.semesters.length === 0 ? (
                    <div className="text-xs text-text-muted">None yet</div>
                  ) : (
                    <div className="space-y-1.5">
                      {y.semesters.map((s) => (
                        <div key={s.id} className="flex items-center justify-between rounded-sm bg-surface-2 px-3 py-2">
                          <div className="flex items-center gap-2 text-[13px]">
                            <span className="font-medium text-text-primary">{s.label}</span>
                            <span className="text-xs text-text-muted">{s.yearLevel}</span>
                            <Badge tone={SEM_TONE[s.status as keyof typeof SEM_TONE] ?? 'neutral'}>{s.status}</Badge>
                          </div>
                          {s.status === 'UPCOMING' && (
                            <button className="text-xs font-medium text-primary hover:underline" onClick={() => activateSem.mutate(s.id)}>
                              Activate
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase text-text-muted">Batches</div>
                  {y.batches.length === 0 ? (
                    <div className="text-xs text-text-muted">None yet</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {y.batches.map((b) => (
                        <div key={b.id} className="rounded-sm bg-surface-2 px-3 py-2 text-[13px]">
                          <span className="font-medium text-text-primary">Batch {b.code}</span>
                          <span className="ml-2 text-xs text-text-muted">{b.yearLevel} · {b.studentCount} students</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateYearModal open={showYear} onClose={() => setShowYear(false)} onDone={refresh} />
      <CreateSemesterModal year={semFor} onClose={() => setSemFor(null)} onDone={refresh} />
      <CreateBatchModal year={batchFor} onClose={() => setBatchFor(null)} onDone={refresh} />
    </PageShell>
  )
}

function CreateYearModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [label, setLabel] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const m = useMutation({
    mutationFn: () => universityApi.createYear({ label, startDate: start, endDate: end }),
    onSuccess: () => { toast.success('Year created'); onDone(); onClose(); setLabel(''); setStart(''); setEnd('') },
    onError: (e) => toast.error(errorMessage(e)),
  })
  return (
    <Modal open={open} onClose={onClose} title="New Academic Year"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => m.mutate()} loading={m.isPending} disabled={!label || !start || !end}>Create</Button></>}>
      <div className="space-y-3">
        <div><label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">Label *</label><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="2027-28" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">Start *</label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div><label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">End *</label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        </div>
      </div>
    </Modal>
  )
}

function CreateSemesterModal({ year, onClose, onDone }: { year: UniYear | null; onClose: () => void; onDone: () => void }) {
  const [number, setNumber] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const m = useMutation({
    mutationFn: () => universityApi.createSemester({ academicYearId: year!.id, number: Number(number), startDate: start, endDate: end }),
    onSuccess: () => { toast.success('Semester created with phases T1–T4'); onDone(); onClose(); setNumber(''); setStart(''); setEnd('') },
    onError: (e) => toast.error(errorMessage(e)),
  })
  return (
    <Modal open={!!year} onClose={onClose} title={`New Semester — ${year?.label ?? ''}`}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => m.mutate()} loading={m.isPending} disabled={!number || !start || !end}>Create</Button></>}>
      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">Semester Number *</label>
          <Select value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Select"
            options={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ value: String(n), label: `Semester ${n} (${n <= 2 ? 'FY' : n <= 4 ? 'SY' : n <= 6 ? 'TY' : 'Final'})` }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">Start *</label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div><label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">End *</label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        </div>
        <p className="text-xs text-text-muted">Phases T1–T4 are created automatically, split evenly across the dates.</p>
      </div>
    </Modal>
  )
}

function CreateBatchModal({ year, onClose, onDone }: { year: UniYear | null; onClose: () => void; onDone: () => void }) {
  const [code, setCode] = useState('')
  const [yearLevel, setYearLevel] = useState('')
  const m = useMutation({
    mutationFn: () => universityApi.createBatch({ academicYearId: year!.id, code, yearLevel }),
    onSuccess: () => { toast.success('Batch created'); onDone(); onClose(); setCode(''); setYearLevel('') },
    onError: (e) => toast.error(errorMessage(e)),
  })
  return (
    <Modal open={!!year} onClose={onClose} title={`New Batch — ${year?.label ?? ''}`}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => m.mutate()} loading={m.isPending} disabled={!code || !yearLevel}>Create</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">Code *</label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="C3" /></div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">Year Level *</label>
          <Select value={yearLevel} onChange={(e) => setYearLevel(e.target.value)} placeholder="Select"
            options={[{ value: 'FY', label: 'First Year' }, { value: 'SY', label: 'Second Year' }, { value: 'TY', label: 'Third Year' }, { value: 'FINAL', label: 'Final Year' }]} />
        </div>
      </div>
    </Modal>
  )
}
