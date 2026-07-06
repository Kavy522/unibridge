import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  path: string
  icon: LucideIcon
  end?: boolean
  badge?: number
  badgeTone?: 'danger' | 'primary'
}

export interface NavSection {
  section: string
  items: NavItem[]
}
