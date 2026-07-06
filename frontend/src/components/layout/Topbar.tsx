import { Bell, Menu, Search } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { useUser } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'

export function Topbar() {
  const user = useUser()
  const setMobileSidebar = useUiStore((s) => s.setMobileSidebar)

  return (
    <header className="sticky top-0 z-20 flex h-topbar items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur md:px-6">
      <button
        onClick={() => setMobileSidebar(true)}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-sm text-text-secondary hover:bg-surface-2 lg:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="hidden max-w-md flex-1 md:block">
        <Input
          leftIcon={<Search size={16} />}
          placeholder="Search students, faculty, subjects…"
          className="h-9 bg-surface-2"
        />
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        <button
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-sm text-text-secondary hover:bg-surface-2"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-danger" />
        </button>
        <div className="flex items-center gap-2 pl-1">
          <Avatar name={user?.name} size={32} />
          <span className="hidden text-sm font-medium text-text-primary sm:block">
            {user?.name}
          </span>
        </div>
      </div>
    </header>
  )
}
