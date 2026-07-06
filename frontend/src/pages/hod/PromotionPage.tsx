import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowRight, Check, RefreshCw, Rocket } from 'lucide-react'
import { hodApi } from '@/api/hod'
import { errorMessage } from '@/api/client'
import { cn } from '@/lib/utils'
import { PageShell } from '@/components/shared/PageShell'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { Table, Td, Th, Tr } from '@/components/ui/Table'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'

interface Year { id: string; label: string; status: string; studentCount: number }
interface PreviewGroup {
  yearLevel: string; targetYearLevel: string
  students: { enrollmentNo: string; name: string; fromBatchCode: string; fromSemesterLabel: string }[]
  availableTargetBatches: { id: string; code: string }[]
}
interface PromoPreview { fromYearLabel: string; toYearLabel: string; groups: PreviewGroup[]; unmappedCount: number }

const STEPS = ['Years', 'Map Batches', 'Roll Numbers', 'Execute']

export default function PromotionPage() {
  const qc = useQueryClient()
  const [step, setStep] = useState(0)
  const [fromYear, setFromYear] = useState('')
  const [toYear, setToYear] = useState('')
  const [draftId, setDraftId] = useState('')
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [confirmExec, setConfirmExec] = useState(false)

  const years = useQuery({ queryKey: ['hod', 'promo', 'years'], queryFn: () => hodApi.promotion.years() as Promise<{ years: Year[] }> })
  const preview = useQuery({
    queryKey: ['hod', 'promo', 'preview', fromYear, toYear],
    queryFn: () => hodApi.promotion.preview(fromYear, toYear) as Promise<PromoPreview>,
    enabled: step >= 1 && !!fromYear && !!toYear,
  })
  const rollSuggest = useQuery({
    queryKey: ['hod', 'promo', 'rolls', draftId],
    queryFn: () => hodApi.promotion.suggestRolls(draftId) as Promise<{ suggestions: { enrollmentNo: string; suggestedRollNo: string }[] }>,
    enabled: step === 2 && !!draftId,
  })
  const summary = useQuery({
    queryKey: ['hod', 'promo', 'summary', draftId],
    queryFn: () => hodApi.promotion.previewSummary(draftId) as Promise<{ totalStudents: number; mappedStudents: number; heldStudents: number; byBatch: { toBatchCode: string; count: number }[] }>,
    enabled: step === 3 && !!draftId,
  })
  const history = useQuery({ queryKey: ['hod', 'promo', 'history'], queryFn: () => hodApi.promotion.history(1, 5) as Promise<{ data: { id: string; fromYear: string; toYear: string; promotedCount: number; executedAt: string; executedBy: string }[] }> })

  const saveMapping = useMutation({
    mutationFn: () => hodApi.promotion.saveMapping({
      fromAcademicYearId: fromYear, toAcademicYearId: toYear,
      mappings: Object.entries(mappings).map(([enrollmentNo, toBatchId]) => ({ enrollmentNo, toBatchId })),
    }) as Promise<{ draftId: string }>,
    onSuccess: (r) => { setDraftId(r.draftId); toast.success('Mapping saved'); setStep(2) },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const execute = useMutation({
    mutationFn: () => hodApi.promotion.execute({
      draftId, fromAcademicYearId: fromYear, toAcademicYearId: toYear,
      mappings: Object.entries(mappings).map(([enrollmentNo, toBatchId]) => ({ enrollmentNo, toBatchId })),
    }) as Promise<{ promoted: number }>,
    onSuccess: (r) => {
      toast.success(`Promoted ${r.promoted} students`)
      qc.invalidateQueries({ queryKey: ['hod', 'promo'] })
      setConfirmExec(false)
      setStep(0); setDraftId(''); setMappings({})
    },
    onError: (e) => { toast.error(errorMessage(e)); setConfirmExec(false) },
  })

  const yearOptions = years.data?.years.map((y) => ({ value: y.id, label: `${y.label} (${y.status})` })) ?? []

  return (
    <PageShell title="Promotion" subtitle="Advance students to the next academic year">
      <Card className="mb-4">
        <CardBody>
          <div className="mb-6 flex items-center">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold', i < step ? 'bg-success text-white' : i === step ? 'bg-primary text-white' : 'bg-bg text-text-muted')}>
                    {i < step ? <Check size={15} /> : i + 1}
                  </div>
                  <span className={cn('mt-1 text-[11px] font-medium', i === step ? 'text-primary' : 'text-text-muted')}>{label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={cn('mx-2 h-0.5 flex-1', i < step ? 'bg-success' : 'bg-border')} />}
              </div>
            ))}
          </div>

          {/* Step 0 */}
          {step === 0 && (
            <div className="space-y-4">
              {years.isLoading ? <Spinner /> : (
                <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
                  <Labeled label="From Academic Year">
                    <Select value={fromYear} onChange={(e) => setFromYear(e.target.value)} placeholder="Select source year" options={yearOptions} />
                  </Labeled>
                  <ArrowRight className="mx-auto mb-2.5 text-text-muted" />
                  <Labeled label="To Academic Year">
                    <Select value={toYear} onChange={(e) => setToYear(e.target.value)} placeholder="Select target year" options={yearOptions} />
                  </Labeled>
                </div>
              )}
              <div className="flex justify-end">
                <Button disabled={!fromYear || !toYear || fromYear === toYear} onClick={() => setStep(1)}>Continue</Button>
              </div>
            </div>
          )}

          {/* Step 1: mapping */}
          {step === 1 && (
            <div className="space-y-4">
              {preview.isLoading || !preview.data ? <Spinner /> : (
                <>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Badge tone="primary">{preview.data.fromYearLabel}</Badge>
                    <ArrowRight size={14} />
                    <Badge tone="success">{preview.data.toYearLabel}</Badge>
                    {preview.data.unmappedCount > 0 && <span className="ml-auto text-warning">{preview.data.unmappedCount} unmapped</span>}
                  </div>
                  {preview.data.groups.map((g) => (
                    <div key={g.yearLevel}>
                      <div className="mb-2 text-sm font-semibold">{g.yearLevel} → {g.targetYearLevel}</div>
                      <div className="max-h-64 overflow-y-auto rounded-sm border border-border">
                        <Table>
                          <thead><tr><Th>Student</Th><Th>From Batch</Th><Th>Target Batch</Th></tr></thead>
                          <tbody>
                            {g.students.map((st) => (
                              <Tr key={st.enrollmentNo}>
                                <Td><div className="font-medium">{st.name}</div><div className="font-mono text-[11px] text-text-muted">{st.enrollmentNo}</div></Td>
                                <Td>{st.fromBatchCode}</Td>
                                <Td>
                                  <Select className="h-8 w-32" value={mappings[st.enrollmentNo] ?? ''} placeholder="—"
                                    onChange={(e) => setMappings((m) => ({ ...m, [st.enrollmentNo]: e.target.value }))}
                                    options={g.availableTargetBatches.map((b) => ({ value: b.id, label: b.code }))} />
                                </Td>
                              </Tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
                    <Button loading={saveMapping.isPending} disabled={Object.keys(mappings).length === 0} onClick={() => saveMapping.mutate()}>Save & Continue</Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: roll numbers */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-secondary">Auto-suggested roll numbers based on branch + batch pattern.</p>
                <Button variant="outline" size="sm" leftIcon={<RefreshCw size={14} />} onClick={() => rollSuggest.refetch()}>Regenerate</Button>
              </div>
              {rollSuggest.isLoading ? <Spinner /> : (
                <div className="max-h-72 overflow-y-auto rounded-sm border border-border">
                  <Table>
                    <thead><tr><Th>Enrollment No.</Th><Th>Suggested Roll No.</Th></tr></thead>
                    <tbody>
                      {rollSuggest.data?.suggestions.map((s) => (
                        <Tr key={s.enrollmentNo}><Td className="font-mono text-xs">{s.enrollmentNo}</Td><Td className="font-semibold">{s.suggestedRollNo}</Td></Tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)}>Continue</Button>
              </div>
            </div>
          )}

          {/* Step 3: execute */}
          {step === 3 && (
            <div className="space-y-4">
              {summary.isLoading || !summary.data ? <Spinner /> : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <MiniStat label="Total" value={summary.data.totalStudents} />
                    <MiniStat label="Mapped" value={summary.data.mappedStudents} tone="success" />
                    <MiniStat label="Held Back" value={summary.data.heldStudents} tone="warning" />
                  </div>
                  <div className="rounded-sm border border-border">
                    <Table>
                      <thead><tr><Th>Target Batch</Th><Th className="text-right">Students</Th></tr></thead>
                      <tbody>
                        {summary.data.byBatch.map((b) => (
                          <Tr key={b.toBatchCode}><Td className="font-semibold">{b.toBatchCode}</Td><Td className="text-right tabular-nums">{b.count}</Td></Tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                    <Button variant="danger" leftIcon={<Rocket size={15} />} onClick={() => setConfirmExec(true)}>Execute Promotion</Button>
                  </div>
                </>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Promotion History" />
        <CardBody className="pt-0">
          {history.data && history.data.data.length === 0 ? (
            <EmptyState title="No promotions yet" className="border-0" />
          ) : (
            <Table>
              <thead><tr><Th>From → To</Th><Th>Promoted</Th><Th>Executed By</Th><Th>Date</Th></tr></thead>
              <tbody>
                {history.data?.data.map((h) => (
                  <Tr key={h.id}>
                    <Td>{h.fromYear} → {h.toYear}</Td>
                    <Td className="tabular-nums">{h.promotedCount}</Td>
                    <Td>{h.executedBy}</Td>
                    <Td className="text-text-muted">{new Date(h.executedAt).toLocaleDateString()}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirmExec}
        title="Execute promotion?"
        message="This creates new enrollments and marks current ones inactive. This action is irreversible."
        destructive
        confirmLabel="Execute"
        loading={execute.isPending}
        onConfirm={() => execute.mutate()}
        onCancel={() => setConfirmExec(false)}
      />
    </PageShell>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</label>{children}</div>
}
function MiniStat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'success' | 'warning' }) {
  return (
    <div className="rounded-sm border border-border bg-surface-2 p-3 text-center">
      <div className={cn('text-xl font-bold', tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-text-primary')}>{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  )
}
