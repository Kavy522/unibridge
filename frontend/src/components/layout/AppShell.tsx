import { Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { portalOf, useUser } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { hodNavItems } from './navItems/hodNavItems'
import { facultyNavItems } from './navItems/facultyNavItems'
import { studentNavItems } from './navItems/studentNavItems'
import { universityNavItems } from './navItems/universityNavItems'

export default function AppShell() {
  const user = useUser()
  const role = portalOf(user)
  const mobileOpen = useUiStore((s) => s.mobileSidebarOpen)
  const setMobileSidebar = useUiStore((s) => s.setMobileSidebar)

  const sections =
    role === 'UNIVERSITY' ? universityNavItems : role === 'STUDENT' ? studentNavItems : role === 'HOD' ? hodNavItems : facultyNavItems

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar sections={sections} role={role} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileSidebar(false)}
          />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar
              sections={sections}
              role={role}
              onNavigate={() => setMobileSidebar(false)}
            />
          </div>
        </div>
      )}

      <div className={cn('flex min-w-0 flex-1 flex-col')}>
        <Topbar />
        <main className="scrollbar-thin flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
