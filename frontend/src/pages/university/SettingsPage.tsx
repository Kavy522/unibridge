import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { universityApi } from '@/api/university'
import { errorMessage } from '@/api/client'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { CardSkeleton } from '@/components/ui/Skeleton'

export default function UniversitySettingsPage() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['uni', 'settings'], queryFn: universityApi.settings })
  const [f, setF] = useState({ name: '', website: '', contactEmail: '', address: '' })

  useEffect(() => {
    if (q.data) setF({ name: q.data.name, website: q.data.website ?? '', contactEmail: q.data.contactEmail ?? '', address: q.data.address ?? '' })
  }, [q.data])

  const save = useMutation({
    mutationFn: () => universityApi.updateSettings(f),
    onSuccess: () => { toast.success('Settings saved'); qc.invalidateQueries({ queryKey: ['uni'] }) },
    onError: (e) => toast.error(errorMessage(e)),
  })

  if (q.isLoading) return <PageShell title="University Settings"><CardSkeleton height={260} /></PageShell>

  return (
    <PageShell
      title="University Settings"
      subtitle={q.data ? `${q.data.slug}.uniportal.in` : ''}
      action={<Button onClick={() => save.mutate()} loading={save.isPending} disabled={!f.name}>Save Changes</Button>}
    >
      <Card className="max-w-2xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text-primary">Profile</h3>
          <Badge tone={q.data?.plan === 'PRO' ? 'purple' : 'neutral'}>{q.data?.plan}</Badge>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">University Name *</label>
            <Input value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">Website</label>
              <Input value={f.website} onChange={(e) => setF((s) => ({ ...s, website: e.target.value }))} placeholder="https://…" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">Contact Email</label>
              <Input type="email" value={f.contactEmail} onChange={(e) => setF((s) => ({ ...s, contactEmail: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase text-text-secondary">Address</label>
            <Textarea value={f.address} onChange={(e) => setF((s) => ({ ...s, address: e.target.value }))} className="min-h-[80px]" />
          </div>
        </div>
      </Card>
    </PageShell>
  )
}
