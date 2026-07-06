import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileText } from 'lucide-react'
import { studentApi } from '@/api/student'
import { PageShell } from '@/components/shared/PageShell'
import { FilterBar } from '@/components/shared/FilterBar'
import { SearchInput } from '@/components/shared/SearchInput'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { formatDistanceToNow } from 'date-fns'

export default function StudentNotesPage() {
  const [search, setSearch] = useState('')
  const list = useQuery({ queryKey: ['student', 'notes', search], queryFn: () => studentApi.notes({ search: search || undefined, limit: 100 }) })

  return (
    <PageShell title="Notes" subtitle={list.data ? `${list.data.total} notes shared by your faculty` : 'Study materials'}>
      <FilterBar>
        <div className="w-64 max-w-full">
          <SearchInput value={search} onChange={setSearch} placeholder="Search notes" />
        </div>
      </FilterBar>

      {list.isLoading ? (
        <CardSkeleton height={200} />
      ) : list.data && list.data.data.length === 0 ? (
        <EmptyState icon={<FileText size={22} />} title="No notes yet" description="Notes will appear here as your faculty upload them." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {list.data?.data.map((n) => (
            <Card key={n.id} className="flex flex-col p-4">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-sm bg-primary-light text-primary">
                <FileText size={18} />
              </div>
              <div className="text-sm font-semibold text-text-primary line-clamp-2">{n.title}</div>
              <div className="mt-0.5 text-xs text-text-muted">{n.subject.code} · {n.facultyName}</div>
              {n.description && <p className="mt-2 line-clamp-2 text-xs text-text-secondary">{n.description}</p>}
              <div className="mt-3 flex items-center justify-between border-t border-border-light pt-2">
                <Badge tone="neutral">{n.fileType ?? 'PDF'}</Badge>
                <span className="text-[11px] text-text-muted">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
              </div>
              <a
                href={studentApi.noteDownloadUrl(n.id)}
                target="_blank" rel="noreferrer"
                className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-sm bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
              >
                <Download size={13} /> Download
              </a>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  )
}
