import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind class names with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a number with thousands separators (e.g. 3458 -> "3,458"). */
export function formatNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  return n.toLocaleString('en-IN')
}

/** Clamp a percentage into 0–100. */
export function clampPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

/** Attendance status color band used across all three portals. */
export function attendanceTone(pct: number): 'success' | 'warning' | 'danger' {
  if (pct >= 85) return 'success'
  if (pct >= 75) return 'warning'
  return 'danger'
}

/** Initials from a full name (e.g. "Rajesh Patel" -> "RP"). */
export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}
