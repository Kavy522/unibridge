import { Construction } from 'lucide-react'
import { PageShell } from '@/components/shared/PageShell'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * Temporary stub used for routes whose full page is scheduled for a later sprint.
 * Keeps navigation working end-to-end while pages are built out.
 */
export default function PlaceholderPage({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <PageShell title={title} subtitle={subtitle}>
      <EmptyState
        icon={<Construction size={22} />}
        title="Coming soon"
        description="This page is scaffolded and will be wired to the backend in an upcoming sprint."
      />
    </PageShell>
  )
}
