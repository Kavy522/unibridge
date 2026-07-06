import { useRouteError, useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

/** Route-level error boundary so a render error degrades gracefully instead of white-screening. */
export default function RouteError() {
  const error = useRouteError() as Error
  const navigate = useNavigate()
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-light text-danger">
        <AlertTriangle size={26} />
      </div>
      <h1 className="text-lg font-bold text-text-primary">Something went wrong</h1>
      <p className="max-w-md text-sm text-text-secondary">
        {error?.message ?? 'An unexpected error occurred while rendering this page.'}
      </p>
      <div className="mt-2 flex gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </div>
    </div>
  )
}
