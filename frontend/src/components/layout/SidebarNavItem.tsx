import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { NavItem } from './navItems/types'

export function SidebarNavItem({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-sm px-3 py-2 text-[13px] font-medium transition-colors',
          isActive
            ? 'bg-primary-light text-primary'
            : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} className={cn(isActive ? 'text-primary' : 'text-text-muted')} />
          <span className="flex-1">{item.label}</span>
          {item.badge != null && item.badge > 0 && (
            <span
              className={cn(
                'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white',
                item.badgeTone === 'primary' ? 'bg-primary' : 'bg-danger',
              )}
            >
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}
