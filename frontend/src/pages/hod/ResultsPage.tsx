import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Check, FileText, Keyboard, Upload } from 'lucide-react'
import { hodApi } from '@/api/hod'
import { errorMessage } from '@/api/client'
import { useHodScope } from '@/hooks/hod/useHodScope'
import { cn } from '@/lib/utils'
import { PageShell } from '@/components/shared/PageShell'
import { FileDrop } from '@/components/shared/FileDrop'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Table, Td, Th, Tr } from '@/components/ui/Table'
import { Spinner } from '@/components/ui/Spinner'

interface UploadContext {
  phases: { id: string; label: string; number: number; isActive?: boolean; isComplete?: boolean }[]
  subjects: { id: string; code: string; name: string }[]
  batches: { id: string; code: string }[]
}
interface ResultsStudent { enrollmentId: string; enrollmentNo: string; name: string; existingMarks: number | null }
interface Preview {
  studentCount: number; avgMarks: number; belowPassCount: number; isPublished: boolean
  results: { enrollmentNo: string; name: string; marksObtained: number; maxMarks: number; grade: string; status: string }[]
}

const STEPS = ['Context', 'Mode', 'Enter Marks', 'Publish']

export default function ResultsPage() {
  const qc = useQueryClient()
  const scope = useHodScope()
  const semesterId = scope.data?.activeSemester.id

  const [step, setStep] = useState(0)
  const [phaseId, setPhaseId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [batchId, setBatchId] = useState('')
  const [mode, setMode] = useState<'csv' | 'manual'>('csv')
  const [file, setFile] = useState<File | null>(null)
  const [marks, setMarks] = useState<Record<string, { marksObtained: string; maxMarks: string }>>({})

  const ctx = useQuery({
    queryKey: ['hod', 'results', 'ctx', semesterId],
    queryFn: () => hodApi.results.uploadContext(semesterId) as Promise<UploadContext>,
    enabled: !!semesterId,
  })
  const history = useQuery({ queryKey: ['hod', 'results', 'history'], queryFn: () => hodApi.results.uploadHistory(1, 8) as Promise<{ data: { phase: string; subjectCode: string; batchCode: string; uploadedAt: string; studentCount: number }[] }> })
  const phaseStatus = useQuery({ queryKey: ['hod', 'results', 'phase-status', semesterId], queryFn: () => hodApi.results.phaseStatus(semesterId) as Promise<{ phases: { phase: string; subjectsTotal: number; subjectsUploaded: number; status: string }[] }>, enabled: !!semesterId })

  const students = useQuery({
    queryKey: ['hod', 'results', 'students', semesterId, batchId, subjectId],
    queryFn: () => hodApi.results.students(semesterId!, batchId, subjectId) as Promise<{ data: ResultsStudent[] }>,
    enabled: step === 2 && mode === 'manual' && !!semesterId && !!batchId && !!subjectId,
  })
  const preview = useQuery({
    queryKey: ['hod', 'results', 'preview', phaseId, subjectId, batchId],
    queryFn: () => hodApi.results.preview(phaseId, subjectId, batchId) as Promise<Preview>,
    enabled: step === 3 && !!phaseId && !!subjectId && !!batchId,
  })

  const uploadCsv = useMutation({
    mutationFn: () => {
      const form = new FormData()
      form.append('file', file!)
      form.append('phaseId', phaseId)
      form.append('subjectId', subjectId)
      form.append('batchId', batchId)
      return hodApi.results.upload(form) as Promise<{ inserted: number; summary?: { avgMarks: number } }>
    },
    onSuccess: (r) => { toast.success(`${r.inserted} results uploaded`); setStep(3) },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const submitManual = useMutation({
    mutationFn: () => {
      const results = Object.entries(marks)
        .filter(([, v]) => v.marksObtained !== '')
        .map(([enrollmentId, v]) => ({ enrollmentId, marksObtained: Number(v.marksObtained), maxMarks: Number(v.maxMarks || 100), grade: gradeFor(Number(v.marksObtained), Number(v.maxMarks || 100)) }))
      return hodApi.results.manual({ phaseId, subjectId, batchId, results })
    },
    onSuccess: () => { toast.success('Marks submitted'); setStep(3) },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const publish = useMutation({
    mutationFn: () => hodApi.results.publish(phaseId, subjectId, batchId),
    onSuccess: () => {
      toast.success('Results published to students')
      qc.invalidateQueries({ queryKey: ['hod', 'results'] })
      reset()
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  function reset() {
    setStep(0); setPhaseId(''); setSubjectId(''); setBatchId(''); setFile(null); setMarks({}); setMode('csv')
  }

  const canNext0 = phaseId && subjectId && batchId

  return (
    <PageShell title="Results" subtitle="Upload and publish exam results">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardBody>
              {/* Stepper */}
              <div className="mb-6 flex items-center">
                {STEPS.map((label, i) => (
                  <div key={label} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                        i < step ? 'bg-success text-white' : i === step ? 'bg-primary text-white' : 'bg-bg text-text-muted')}>
                        {i < step ? <Check size={15} /> : i + 1}
                      </div>
                      <span className={cn('mt-1 text-[11px] font-medium', i === step ? 'text-primary' : 'text-text-muted')}>{label}</span>
                    </div>
                    {i < STEPS.length - 1 && <div className={cn('mx-2 h-0.5 flex-1', i < step ? 'bg-success' : 'bg-border')} />}
                  </div>
                ))}
              </div>

              {/* Step 0: Context */}
              {step === 0 && (
                <div className="space-y-4">
                  {ctx.isLoading ? <Spinner /> : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <Labeled label="Phase">
                        <Select value={phaseId} onChange={(e) => setPhaseId(e.target.value)} placeholder="Select phase"
                          options={ctx.data?.phases.map((p) => ({ value: p.id, label: p.label })) ?? []} />
                      </Labeled>
                      <Labeled label="Subject">
                        <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} placeholder="Select subject"
                          options={ctx.data?.subjects.map((s) => ({ value: s.id, label: `${s.code}` })) ?? []} />
                      </Labeled>
                      <Labeled label="Batch">
                        <Select value={batchId} onChange={(e) => setBatchId(e.target.value)} placeholder="Select batch"
                          options={ctx.data?.batches.map((b) => ({ value: b.id, label: b.code })) ?? []} />
                      </Labeled>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button disabled={!canNext0} onClick={() => setStep(1)}>Continue</Button>
                  </div>
                </div>
              )}

              {/* Step 1: Mode */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {(['csv', 'manual'] as const).map((m) => (
                      <button key={m} onClick={() => setMode(m)}
                        className={cn('flex flex-col items-center gap-2 rounded-card border-2 p-6 transition-colors',
                          mode === m ? 'border-primary bg-primary-light' : 'border-border hover:bg-surface-2')}>
                        {m === 'csv' ? <FileText size={26} className="text-primary" /> : <Keyboard size={26} className="text-purple" />}
                        <span className="text-sm font-semibold">{m === 'csv' ? 'Upload CSV' : 'Manual Entry'}</span>
                        <span className="text-xs text-text-muted">{m === 'csv' ? 'Bulk import from a file' : 'Type marks per student'}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
                    <Button onClick={() => setStep(2)}>Continue</Button>
                  </div>
                </div>
              )}

              {/* Step 2: Enter */}
              {step === 2 && (
                <div className="space-y-4">
                  {mode === 'csv' ? (
                    <>
                      <FileDrop accept=".csv" onFile={setFile} selectedName={file?.name}
                        subtitle="Columns: enrollment_no, marks_obtained, max_marks, grade" />
                      <div className="flex justify-between">
                        <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                        <Button disabled={!file} loading={uploadCsv.isPending} onClick={() => uploadCsv.mutate()}>Upload & Preview</Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {students.isLoading ? <Spinner /> : (
                        <div className="max-h-96 overflow-y-auto rounded-sm border border-border">
                          <Table>
                            <thead><tr><Th>Student</Th><Th>Marks</Th><Th>Max</Th></tr></thead>
                            <tbody>
                              {students.data?.data.map((st) => (
                                <Tr key={st.enrollmentId}>
                                  <Td><div className="font-medium">{st.name}</div><div className="font-mono text-[11px] text-text-muted">{st.enrollmentNo}</div></Td>
                                  <Td><Input type="number" className="h-8 w-20" value={marks[st.enrollmentId]?.marksObtained ?? ''} onChange={(e) => setMarks((m) => ({ ...m, [st.enrollmentId]: { marksObtained: e.target.value, maxMarks: m[st.enrollmentId]?.maxMarks ?? '100' } }))} /></Td>
                                  <Td><Input type="number" className="h-8 w-20" value={marks[st.enrollmentId]?.maxMarks ?? '100'} onChange={(e) => setMarks((m) => ({ ...m, [st.enrollmentId]: { marksObtained: m[st.enrollmentId]?.marksObtained ?? '', maxMarks: e.target.value } }))} /></Td>
                                </Tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                        <Button loading={submitManual.isPending} onClick={() => submitManual.mutate()}>Submit & Preview</Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 3: Publish */}
              {step === 3 && (
                <div className="space-y-4">
                  {preview.isLoading || !preview.data ? <Spinner /> : (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        <MiniStat label="Students" value={preview.data.studentCount} />
                        <MiniStat label="Avg Marks" value={`${Math.round(preview.data.avgMarks)}%`} />
                        <MiniStat label="Below Pass" value={preview.data.belowPassCount} tone="danger" />
                      </div>
                      <div className="max-h-72 overflow-y-auto rounded-sm border border-border">
                        <Table>
                          <thead><tr><Th>Student</Th><Th>Marks</Th><Th>Grade</Th><Th>Status</Th></tr></thead>
                          <tbody>
                            {preview.data.results.map((r) => (
                              <Tr key={r.enrollmentNo}>
                                <Td><div className="font-medium">{r.name}</div><div className="font-mono text-[11px] text-text-muted">{r.enrollmentNo}</div></Td>
                                <Td>{r.marksObtained}/{r.maxMarks}</Td>
                                <Td><Badge tone={r.grade === 'F' ? 'danger' : 'neutral'}>{r.grade}</Badge></Td>
                                <Td><Badge tone={r.status === 'Fail' ? 'danger' : 'success'}>{r.status}</Badge></Td>
                              </Tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                      <div className="flex items-center justify-between">
                        <Button variant="outline" onClick={reset}>Cancel</Button>
                        <Button loading={publish.isPending} disabled={preview.data.isPublished} onClick={() => publish.mutate()}>
                          {preview.data.isPublished ? 'Already Published' : 'Publish to Students'}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Phase Completion" />
            <CardBody className="space-y-2 pt-0">
              {phaseStatus.data?.phases.map((p) => (
                <div key={p.phase} className="flex items-center justify-between rounded-sm border border-border px-3 py-2">
                  <span className="text-sm font-semibold">{p.phase}</span>
                  <span className="text-xs text-text-muted">{p.subjectsUploaded}/{p.subjectsTotal}</span>
                  <Badge tone={p.status === 'Complete' ? 'success' : p.status === 'In Progress' ? 'warning' : 'neutral'}>{p.status}</Badge>
                </div>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Upload History" />
            <CardBody className="space-y-2 pt-0">
              {history.data?.data.map((h, i) => (
                <div key={i} className="flex items-center gap-2 border-b border-border-light py-2 text-sm last:border-0">
                  <Upload size={14} className="text-text-muted" />
                  <span className="font-semibold">{h.phase}</span>
                  <span className="text-text-secondary">{h.subjectCode} · {h.batchCode}</span>
                  <span className="ml-auto text-xs text-text-muted">{h.studentCount}</span>
                </div>
              ))}
              {history.data && history.data.data.length === 0 && <p className="py-4 text-center text-xs text-text-muted">No uploads yet.</p>}
            </CardBody>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}

function gradeFor(marks: number, max: number): string {
  const pct = (marks / max) * 100
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  return 'F'
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</label>{children}</div>
}
function MiniStat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'danger' }) {
  return (
    <div className="rounded-sm border border-border bg-surface-2 p-3 text-center">
      <div className={cn('text-xl font-bold', tone === 'danger' ? 'text-danger' : 'text-text-primary')}>{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  )
}
