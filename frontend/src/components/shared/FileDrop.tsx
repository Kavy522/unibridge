import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FileDropProps {
  accept?: string
  maxSizeMb?: number
  onFile: (file: File) => void
  title?: string
  subtitle?: string
  disabled?: boolean
  selectedName?: string | null
}

export function FileDrop({
  accept = '.csv',
  maxSizeMb = 10,
  onFile,
  title = 'Drop your file here or click to browse',
  subtitle,
  disabled,
  selectedName,
}: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handle(file?: File | null) {
    setError(null)
    if (!file) return
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File exceeds ${maxSizeMb} MB`)
      return
    }
    onFile(file)
  }

  return (
    <div>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          if (!disabled) handle(e.dataTransfer.files?.[0])
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center rounded-card border-2 border-dashed px-5 py-8 text-center transition-colors',
          drag ? 'border-primary bg-primary-light' : 'border-border bg-surface-2',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <UploadCloud size={32} className={cn('mb-2', drag ? 'text-primary' : 'text-text-muted')} />
        <div className="text-sm font-semibold text-text-primary">
          {selectedName ?? title}
        </div>
        <div className="mt-1 text-xs text-text-muted">
          {selectedName ? 'Click to choose a different file' : (subtitle ?? `${accept} · max ${maxSizeMb} MB`)}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => handle(e.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
    </div>
  )
}
