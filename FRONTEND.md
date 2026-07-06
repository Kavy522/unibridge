# UniPortal — Scalable Multi-Role React Architecture
> Master build prompt for HOD + Faculty + Student portals in a single React codebase
> Three portals, one design system, zero duplication

---

## CORE PHILOSOPHY

All three portals (HOD, Faculty, Student) live in **one React app**. After login, the app detects the user's role and renders the correct portal. Shared infrastructure (auth, design system, API client, common components, hooks) is written once. Only page-level code is role-specific.

```
One app → one build → one deployment
Role detected from JWT → correct sidebar + routes rendered
Shared: design system, API client, auth, layout shell, 60+ UI components
Role-specific: pages, sidebar nav items, API hooks per role
```

---

## TECH STACK — FIXED, NO SUBSTITUTIONS

```
React 19 + TypeScript 5
Vite 5
React Router v6
Zustand 4 (auth store, UI store)
TanStack Query v5 / React Query (server state)
Axios (HTTP + JWT interceptors)
Tailwind CSS v3
shadcn/ui (Radix UI primitives)
Recharts (all charts)
Socket.io-client (mentor chat — Faculty + Student)
react-dropzone (file uploads — HOD + Faculty)
react-hot-toast (toasts)
date-fns (date formatting)
papaparse (client-side CSV preview)
```

---

## COMPLETE FILE STRUCTURE

```
uniportal-web/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env
├── .env.production
│
└── src/
    ├── main.tsx
    ├── App.tsx                        # QueryClient + Toaster + RouterProvider
    │
    ├── config/
    │   └── env.ts                     # typed import.meta.env wrapper
    │
    ├── api/                           # ALL API layer — one file per domain
    │   ├── client.ts                  # Axios instance, JWT interceptors, refresh
    │   │
    │   ├── auth.ts                    # /auth/* — shared by all roles
    │   │
    │   ├── hod/                       # HOD-only endpoints
    │   │   ├── dashboard.ts
    │   │   ├── students.ts
    │   │   ├── faculty.ts
    │   │   ├── results.ts
    │   │   ├── attendance.ts
    │   │   ├── subjects.ts
    │   │   ├── mentorship.ts
    │   │   ├── analytics.ts
    │   │   ├── promotion.ts
    │   │   ├── calendar.ts
    │   │   └── settings.ts
    │   │
    │   ├── faculty/                   # Faculty-only endpoints
    │   │   ├── dashboard.ts
    │   │   ├── scope.ts               # /faculty/my-scope
    │   │   ├── students.ts            # view-only student data
    │   │   ├── attendance.ts          # mark + track attendance
    │   │   ├── notes.ts               # upload + manage notes
    │   │   ├── quizzes.ts             # create + manage quizzes
    │   │   ├── announcements.ts
    │   │   ├── mentees.ts             # mentee list
    │   │   ├── chat.ts                # mentor chat (Faculty side)
    │   │   ├── results.ts             # view-only results
    │   │   ├── calendar.ts
    │   │   ├── analytics.ts
    │   │   └── settings.ts
    │   │
    │   └── student/                   # Student-only endpoints
    │       ├── dashboard.ts
    │       ├── enrollment.ts          # current enrollment + history
    │       ├── timetable.ts
    │       ├── results.ts
    │       ├── attendance.ts
    │       ├── notes.ts               # view faculty notes
    │       ├── selfNotes.ts           # personal notes
    │       ├── quizzes.ts             # attempt + review quizzes
    │       ├── announcements.ts
    │       ├── calendar.ts
    │       ├── chat.ts                # mentor chat (Student side)
    │       ├── ai.ts                  # AI assistant + PYQ analysis
    │       ├── studyPlanner.ts
    │       └── leaderboard.ts
    │
    ├── hooks/                         # Custom hooks — grouped by scope
    │   ├── shared/
    │   │   ├── useAuth.ts             # reads authStore, exposes user + logout
    │   │   ├── useSocket.ts           # Socket.io singleton (Faculty + Student)
    │   │   ├── useDebounce.ts
    │   │   └── usePagination.ts
    │   ├── hod/
    │   │   └── useHodScope.ts         # /hod/my-scope — batches owned by HOD
    │   ├── faculty/
    │   │   └── useFacultyScope.ts     # /faculty/my-scope — assigned batches + subjects
    │   └── student/
    │       └── useStudentEnrollment.ts # /student/enrollment/current
    │
    ├── stores/
    │   ├── authStore.ts               # user, tokens, role, setAuth, logout
    │   └── uiStore.ts                 # sidebarOpen, activeSemesterId, activeYearId
    │
    ├── types/                         # TypeScript interfaces — mirrors API responses
    │   ├── index.ts                   # re-exports all
    │   ├── auth.ts                    # AuthUser, LoginResponse
    │   ├── common.ts                  # PaginatedResponse<T>, ApiError
    │   ├── hod/
    │   │   ├── dashboard.ts
    │   │   ├── student.ts
    │   │   ├── faculty.ts
    │   │   ├── result.ts
    │   │   ├── attendance.ts
    │   │   ├── subject.ts
    │   │   ├── mentorship.ts
    │   │   ├── analytics.ts
    │   │   ├── promotion.ts
    │   │   └── calendar.ts
    │   ├── faculty/
    │   │   ├── scope.ts
    │   │   ├── attendance.ts
    │   │   ├── note.ts
    │   │   ├── quiz.ts
    │   │   ├── mentee.ts
    │   │   └── analytics.ts
    │   └── student/
    │       ├── enrollment.ts
    │       ├── result.ts
    │       ├── attendance.ts
    │       ├── quiz.ts
    │       ├── chat.ts
    │       └── ai.ts
    │
    ├── router/
    │   ├── index.tsx                  # createBrowserRouter — all role routes
    │   ├── ProtectedRoute.tsx         # no token → /login
    │   ├── RoleRouter.tsx             # reads role → render HOD/Faculty/Student routes
    │   ├── HodRoutes.tsx              # /hod/* route definitions
    │   ├── FacultyRoutes.tsx          # /faculty/* route definitions
    │   └── StudentRoutes.tsx          # /student/* route definitions
    │
    ├── components/
    │   │
    │   ├── ui/                        # SHARED DESIGN SYSTEM — used by all 3 roles
    │   │   ├── Card.tsx
    │   │   ├── StatCard.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Button.tsx
    │   │   ├── IconButton.tsx
    │   │   ├── Input.tsx
    │   │   ├── Select.tsx
    │   │   ├── Textarea.tsx
    │   │   ├── Checkbox.tsx
    │   │   ├── Toggle.tsx
    │   │   ├── Tabs.tsx
    │   │   ├── Modal.tsx
    │   │   ├── FileDrop.tsx
    │   │   ├── Table.tsx
    │   │   ├── Pagination.tsx
    │   │   ├── Avatar.tsx
    │   │   ├── ProgressBar.tsx
    │   │   ├── Spinner.tsx
    │   │   ├── EmptyState.tsx
    │   │   ├── Stepper.tsx
    │   │   ├── Chip.tsx
    │   │   ├── Tooltip.tsx
    │   │   ├── Skeleton.tsx           # skeleton variants: card, table, chart
    │   │   └── ConfirmDialog.tsx
    │   │
    │   ├── shared/                    # SHARED COMPOUND — reused across roles
    │   │   ├── PageShell.tsx          # h1 + subtitle + action slot
    │   │   ├── FilterBar.tsx          # search + selects row
    │   │   ├── CSVPreview.tsx         # papaparse → preview table
    │   │   ├── ActivityFeed.tsx       # icon + title + time list
    │   │   ├── SearchInput.tsx        # debounced search
    │   │   ├── SectionLabel.tsx       # uppercase divider label
    │   │   ├── AttendancePctCell.tsx  # progress bar + color text — used in all 3 roles
    │   │   ├── PhaseTimeline.tsx      # T1–T4 phase status — HOD + Faculty + Student
    │   │   ├── CalendarGrid.tsx       # month grid — HOD + Faculty + Student see same grid
    │   │   ├── ChatWindow.tsx         # chat UI — Faculty + Student share this
    │   │   ├── ChatMessageBubble.tsx
    │   │   └── AnnouncementFeed.tsx   # announcement list — all 3 roles see this
    │   │
    │   ├── charts/                    # SHARED CHARTS — any role can use
    │   │   ├── AttendanceTrendChart.tsx
    │   │   ├── MarksBarChart.tsx
    │   │   ├── AttendanceHeatmap.tsx
    │   │   ├── GradeDistChart.tsx
    │   │   ├── SubjectAttChart.tsx
    │   │   ├── PhaseMarksChart.tsx
    │   │   ├── RadarChart.tsx
    │   │   ├── YoYCompareChart.tsx
    │   │   └── DonutChart.tsx
    │   │
    │   └── layout/
    │       ├── AppShell.tsx           # wraps all 3 portals — sidebar + topbar + outlet
    │       ├── Sidebar.tsx            # receives navItems prop — different per role
    │       ├── SidebarNavItem.tsx
    │       ├── SidebarContext.tsx     # academic year + semester selector (HOD + Faculty)
    │       ├── Topbar.tsx             # search + bell + avatar — same across all roles
    │       ├── MobileSidebarDrawer.tsx # off-canvas sidebar for mobile
    │       └── navItems/
    │           ├── hodNavItems.ts     # 11 items: Dashboard → Settings
    │           ├── facultyNavItems.ts # 10 items: Dashboard → Settings
    │           └── studentNavItems.ts # 10 items: Dashboard → Leaderboard
    │
    └── pages/
        ├── auth/
        │   ├── LoginPage.tsx          # shared — role selector picks destination
        │   └── ForgotPasswordPage.tsx
        │
        ├── hod/                       # HOD PAGES
        │   ├── DashboardPage.tsx
        │   ├── StudentsPage.tsx
        │   ├── FacultyPage.tsx
        │   ├── ResultsPage.tsx
        │   ├── AttendancePage.tsx
        │   ├── SubjectsPage.tsx
        │   ├── MentorshipPage.tsx
        │   ├── AnalyticsPage.tsx
        │   ├── PromotionPage.tsx
        │   ├── CalendarPage.tsx
        │   └── SettingsPage.tsx
        │
        ├── faculty/                   # FACULTY PAGES
        │   ├── DashboardPage.tsx
        │   ├── SchedulePage.tsx       # timetable + today's classes
        │   ├── StudentsPage.tsx       # view-only student list
        │   ├── AttendancePage.tsx     # mark + track attendance
        │   ├── NotesPage.tsx          # upload + manage notes
        │   ├── QuizzesPage.tsx        # create + manage quizzes
        │   ├── AnnouncementsPage.tsx
        │   ├── MenteesPage.tsx        # mentee list + per-mentee profile
        │   ├── ResultsPage.tsx        # view-only results
        │   ├── CalendarPage.tsx
        │   ├── AnalyticsPage.tsx
        │   └── SettingsPage.tsx
        │
        └── student/                   # STUDENT PAGES
            ├── DashboardPage.tsx
            ├── TimetablePage.tsx
            ├── ResultsPage.tsx
            ├── AttendancePage.tsx
            ├── NotesPage.tsx          # faculty notes + flashcards
            ├── SelfNotesPage.tsx      # personal notes
            ├── QuizzesPage.tsx        # attempt + review
            ├── AnnouncementsPage.tsx
            ├── CalendarPage.tsx
            ├── MentorChatPage.tsx
            ├── AIAssistantPage.tsx
            ├── StudyPlannerPage.tsx
            ├── LeaderboardPage.tsx
            └── SettingsPage.tsx
```

---

## DESIGN TOKENS — TAILWIND CONFIG

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563EB', dark: '#1D4ED8', light: '#EFF6FF', mid: '#DBEAFE' },
        success: { DEFAULT: '#16A34A', light: '#DCFCE7' },
        warning: { DEFAULT: '#D97706', light: '#FEF3C7' },
        danger:  { DEFAULT: '#DC2626', light: '#FEE2E2' },
        purple:  { DEFAULT: '#7C3AED', light: '#EDE9FE' },
        teal:    { DEFAULT: '#0891B2', light: '#E0F7FA' },
        surface: { DEFAULT: '#FFFFFF', 2: '#F8FAFC' },
        bg:      '#F1F5F9',
        border:  { DEFAULT: '#E2E8F0', light: '#F1F5F9' },
        text:    { primary: '#0F172A', secondary: '#475569', muted: '#94A3B8' },
      },
      borderRadius: { card: '12px', sm: '8px', xs: '6px' },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        md:   '0 4px 12px rgba(0,0,0,0.08)',
        lg:   '0 10px 30px rgba(0,0,0,0.12)',
      },
      fontFamily: { sans: ['Inter', '-apple-system', 'sans-serif'] },
      width:  { sidebar: '220px' },
      height: { topbar:  '64px' },
    },
  },
  plugins: [],
} satisfies Config
```

---

## AUTH STORE — SINGLE SOURCE OF TRUTH

```typescript
// stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'FACULTY' | 'STUDENT'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  isHod: boolean          // true = HOD portal, false = Faculty portal
  universityId: string
  department?: string     // Faculty only
  mentorCode?: string     // Faculty only (non-HOD)
  employeeId?: string     // Faculty only
  enrollmentNo?: string   // Student only
  branch?: string         // Student only
  admissionYear?: number  // Student only
}

interface AuthStore {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isFirstLogin: boolean
  setAuth: (payload: {
    user: AuthUser
    accessToken: string
    refreshToken: string
    isFirstLogin?: boolean
  }) => void
  setAccessToken: (token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isFirstLogin: false,
      setAuth: ({ user, accessToken, refreshToken, isFirstLogin = false }) =>
        set({ user, accessToken, refreshToken, isFirstLogin }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null, isFirstLogin: false }),
    }),
    { name: 'uniportal-auth', version: 1 }
  )
)

// Convenience selectors — use these, not raw store
export const useUser = () => useAuthStore((s) => s.user)
export const useIsHod = () => useAuthStore((s) => s.user?.isHod ?? false)
export const useIsFaculty = () =>
  useAuthStore((s) => s.user?.role === 'FACULTY' && !s.user?.isHod)
export const useIsStudent = () => useAuthStore((s) => s.user?.role === 'STUDENT')
```

---

## ROUTING — ROLE-BASED

```typescript
// router/index.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/auth/LoginPage'
import AppShell from '@/components/layout/AppShell'
import ProtectedRoute from './ProtectedRoute'
import RoleRouter from './RoleRouter'

// HOD pages
import HOD_Dashboard   from '@/pages/hod/DashboardPage'
import HOD_Students    from '@/pages/hod/StudentsPage'
import HOD_Faculty     from '@/pages/hod/FacultyPage'
import HOD_Results     from '@/pages/hod/ResultsPage'
import HOD_Attendance  from '@/pages/hod/AttendancePage'
import HOD_Subjects    from '@/pages/hod/SubjectsPage'
import HOD_Mentorship  from '@/pages/hod/MentorshipPage'
import HOD_Analytics   from '@/pages/hod/AnalyticsPage'
import HOD_Promotion   from '@/pages/hod/PromotionPage'
import HOD_Calendar    from '@/pages/hod/CalendarPage'
import HOD_Settings    from '@/pages/hod/SettingsPage'

// Faculty pages
import FAC_Dashboard    from '@/pages/faculty/DashboardPage'
import FAC_Schedule     from '@/pages/faculty/SchedulePage'
import FAC_Students     from '@/pages/faculty/StudentsPage'
import FAC_Attendance   from '@/pages/faculty/AttendancePage'
import FAC_Notes        from '@/pages/faculty/NotesPage'
import FAC_Quizzes      from '@/pages/faculty/QuizzesPage'
import FAC_Announcements from '@/pages/faculty/AnnouncementsPage'
import FAC_Mentees      from '@/pages/faculty/MenteesPage'
import FAC_Results      from '@/pages/faculty/ResultsPage'
import FAC_Calendar     from '@/pages/faculty/CalendarPage'
import FAC_Analytics    from '@/pages/faculty/AnalyticsPage'
import FAC_Settings     from '@/pages/faculty/SettingsPage'

// Student pages
import STU_Dashboard     from '@/pages/student/DashboardPage'
import STU_Timetable     from '@/pages/student/TimetablePage'
import STU_Results       from '@/pages/student/ResultsPage'
import STU_Attendance    from '@/pages/student/AttendancePage'
import STU_Notes         from '@/pages/student/NotesPage'
import STU_SelfNotes     from '@/pages/student/SelfNotesPage'
import STU_Quizzes       from '@/pages/student/QuizzesPage'
import STU_Announcements from '@/pages/student/AnnouncementsPage'
import STU_Calendar      from '@/pages/student/CalendarPage'
import STU_Chat          from '@/pages/student/MentorChatPage'
import STU_AI            from '@/pages/student/AIAssistantPage'
import STU_Planner       from '@/pages/student/StudyPlannerPage'
import STU_Leaderboard   from '@/pages/student/LeaderboardPage'
import STU_Settings      from '@/pages/student/SettingsPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [{
      element: <AppShell />,           // Single shell — renders correct nav via RoleRouter
      children: [

        // ── HOD ROUTES (/hod/*) ───────────────────────
        { path: '/hod',             element: <HOD_Dashboard /> },
        { path: '/hod/students',    element: <HOD_Students /> },
        { path: '/hod/faculty',     element: <HOD_Faculty /> },
        { path: '/hod/results',     element: <HOD_Results /> },
        { path: '/hod/attendance',  element: <HOD_Attendance /> },
        { path: '/hod/subjects',    element: <HOD_Subjects /> },
        { path: '/hod/mentorship',  element: <HOD_Mentorship /> },
        { path: '/hod/analytics',   element: <HOD_Analytics /> },
        { path: '/hod/promotion',   element: <HOD_Promotion /> },
        { path: '/hod/calendar',    element: <HOD_Calendar /> },
        { path: '/hod/settings/:section?', element: <HOD_Settings /> },

        // ── FACULTY ROUTES (/faculty/*) ────────────────
        { path: '/faculty',              element: <FAC_Dashboard /> },
        { path: '/faculty/schedule',     element: <FAC_Schedule /> },
        { path: '/faculty/students',     element: <FAC_Students /> },
        { path: '/faculty/attendance',   element: <FAC_Attendance /> },
        { path: '/faculty/notes',        element: <FAC_Notes /> },
        { path: '/faculty/quizzes',      element: <FAC_Quizzes /> },
        { path: '/faculty/announcements',element: <FAC_Announcements /> },
        { path: '/faculty/mentees',      element: <FAC_Mentees /> },
        { path: '/faculty/results',      element: <FAC_Results /> },
        { path: '/faculty/calendar',     element: <FAC_Calendar /> },
        { path: '/faculty/analytics',    element: <FAC_Analytics /> },
        { path: '/faculty/settings/:section?', element: <FAC_Settings /> },

        // ── STUDENT ROUTES (/student/*) ────────────────
        { path: '/student',               element: <STU_Dashboard /> },
        { path: '/student/timetable',     element: <STU_Timetable /> },
        { path: '/student/results',       element: <STU_Results /> },
        { path: '/student/attendance',    element: <STU_Attendance /> },
        { path: '/student/notes',         element: <STU_Notes /> },
        { path: '/student/self-notes',    element: <STU_SelfNotes /> },
        { path: '/student/quizzes',       element: <STU_Quizzes /> },
        { path: '/student/announcements', element: <STU_Announcements /> },
        { path: '/student/calendar',      element: <STU_Calendar /> },
        { path: '/student/mentor',        element: <STU_Chat /> },
        { path: '/student/ai',            element: <STU_AI /> },
        { path: '/student/study-planner', element: <STU_Planner /> },
        { path: '/student/leaderboard',   element: <STU_Leaderboard /> },
        { path: '/student/settings/:section?', element: <STU_Settings /> },

        // Root redirect — go to correct portal home based on role
        { path: '/', element: <RoleRouter /> },
        { path: '*', element: <Navigate to="/" replace /> },
      ]
    }]
  }
])
```

```typescript
// router/RoleRouter.tsx
// Redirects to the correct portal home after login
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export default function RoleRouter() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'FACULTY') {
    return <Navigate to={user.isHod ? '/hod' : '/faculty'} replace />
  }
  return <Navigate to="/student" replace />
}
```

```typescript
// router/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export default function ProtectedRoute() {
  const token = useAuthStore((s) => s.accessToken)
  return token ? <Outlet /> : <Navigate to="/login" replace />
}
```

---

## APP SHELL — ONE LAYOUT, THREE SIDEBARS

```typescript
// components/layout/AppShell.tsx
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { hodNavItems } from './navItems/hodNavItems'
import { facultyNavItems } from './navItems/facultyNavItems'
import { studentNavItems } from './navItems/studentNavItems'
import { useAuthStore } from '@/stores/authStore'

export default function AppShell() {
  const user = useAuthStore((s) => s.user)

  const navItems = user?.role === 'STUDENT'
    ? studentNavItems
    : user?.isHod
      ? hodNavItems
      : facultyNavItems

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar navItems={navItems} role={user?.isHod ? 'HOD' : user?.role ?? 'STUDENT'} />
      <main className="ml-[220px] flex flex-col min-h-screen flex-1">
        <Topbar />
        <div className="p-6 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
```

```typescript
// components/layout/Sidebar.tsx
interface NavItem {
  id: string
  label: string
  path: string
  icon: React.ComponentType<{ size?: number }>
  badge?: number         // for unread counts
  badgeVariant?: 'danger' | 'primary'
}

interface SidebarProps {
  navItems: NavItem[]
  role: 'HOD' | 'FACULTY' | 'STUDENT'
}

// Sidebar shows:
// 1. Brand (LJ logo + "UniPortal" + role label)
// 2. SidebarContext — year/semester selector (HOD + Faculty) | semester info (Student)
// 3. Nav items grouped with section labels
// 4. Footer — user avatar + name + role + logout
```

---

## NAV ITEMS PER ROLE

```typescript
// components/layout/navItems/hodNavItems.ts
import {
  LayoutDashboard, Users, UserCheck, ClipboardList,
  CalendarCheck, BookOpen, UserPlus, Activity,
  RefreshCw, Calendar, Settings
} from 'lucide-react'

export const hodNavItems = [
  // Section: Main
  { id: 'dashboard',  label: 'Dashboard',   path: '/hod',             icon: LayoutDashboard },
  { id: 'students',   label: 'Students',    path: '/hod/students',    icon: Users },
  { id: 'faculty',    label: 'Faculty',     path: '/hod/faculty',     icon: UserCheck },
  { id: 'results',    label: 'Results',     path: '/hod/results',     icon: ClipboardList },
  { id: 'attendance', label: 'Attendance',  path: '/hod/attendance',  icon: CalendarCheck },
  { id: 'subjects',   label: 'Subjects',    path: '/hod/subjects',    icon: BookOpen },
  // Section: Management
  { id: 'mentorship', label: 'Mentorship',  path: '/hod/mentorship',  icon: UserPlus },
  { id: 'analytics',  label: 'Analytics',   path: '/hod/analytics',   icon: Activity },
  { id: 'promotion',  label: 'Promotion',   path: '/hod/promotion',   icon: RefreshCw },
  { id: 'calendar',   label: 'Calendar',    path: '/hod/calendar',    icon: Calendar },
  { id: 'settings',   label: 'Settings',    path: '/hod/settings',    icon: Settings },
]
```

```typescript
// components/layout/navItems/facultyNavItems.ts
import {
  LayoutDashboard, CalendarDays, Users, CalendarCheck,
  FileText, HelpCircle, Megaphone, Heart,
  ClipboardList, Calendar, Activity, Settings
} from 'lucide-react'

export const facultyNavItems = [
  // Section: Teaching
  { id: 'dashboard',    label: 'Dashboard',     path: '/faculty',              icon: LayoutDashboard },
  { id: 'schedule',     label: 'My Schedule',   path: '/faculty/schedule',     icon: CalendarDays },
  { id: 'students',     label: 'Students',      path: '/faculty/students',     icon: Users },
  { id: 'attendance',   label: 'Attendance',    path: '/faculty/attendance',   icon: CalendarCheck },
  { id: 'notes',        label: 'Notes',         path: '/faculty/notes',        icon: FileText },
  { id: 'quizzes',      label: 'Quizzes',       path: '/faculty/quizzes',      icon: HelpCircle },
  // Section: Communication
  { id: 'announcements',label: 'Announcements', path: '/faculty/announcements',icon: Megaphone },
  { id: 'mentees',      label: 'Mentees',       path: '/faculty/mentees',      icon: Heart },
  // Section: Data
  { id: 'results',      label: 'Results',       path: '/faculty/results',      icon: ClipboardList },
  { id: 'analytics',    label: 'Analytics',     path: '/faculty/analytics',    icon: Activity },
  { id: 'calendar',     label: 'Calendar',      path: '/faculty/calendar',     icon: Calendar },
  { id: 'settings',     label: 'Settings',      path: '/faculty/settings',     icon: Settings },
]
```

```typescript
// components/layout/navItems/studentNavItems.ts
import {
  LayoutDashboard, Clock, BarChart2, CalendarCheck,
  BookOpen, PenTool, HelpCircle, Megaphone,
  Calendar, MessageCircle, Sparkles, Target,
  Trophy, Settings
} from 'lucide-react'

export const studentNavItems = [
  // Section: Academic
  { id: 'dashboard',    label: 'Dashboard',       path: '/student',                icon: LayoutDashboard },
  { id: 'timetable',    label: 'Timetable',       path: '/student/timetable',      icon: Clock },
  { id: 'results',      label: 'Results',         path: '/student/results',        icon: BarChart2 },
  { id: 'attendance',   label: 'Attendance',      path: '/student/attendance',     icon: CalendarCheck },
  // Section: Study Tools
  { id: 'notes',        label: 'Notes',           path: '/student/notes',          icon: BookOpen },
  { id: 'self-notes',   label: 'My Notes',        path: '/student/self-notes',     icon: PenTool },
  { id: 'quizzes',      label: 'Quizzes',         path: '/student/quizzes',        icon: HelpCircle },
  { id: 'ai',           label: 'AI Assistant',    path: '/student/ai',             icon: Sparkles },
  { id: 'planner',      label: 'Study Planner',   path: '/student/study-planner',  icon: Target },
  // Section: Connect
  { id: 'announcements',label: 'Announcements',   path: '/student/announcements',  icon: Megaphone },
  { id: 'mentor',       label: 'Mentor Chat',     path: '/student/mentor',         icon: MessageCircle },
  { id: 'calendar',     label: 'Calendar',        path: '/student/calendar',       icon: Calendar },
  { id: 'leaderboard',  label: 'Leaderboard',     path: '/student/leaderboard',    icon: Trophy },
  { id: 'settings',     label: 'Settings',        path: '/student/settings',       icon: Settings },
]
```

---

## AXIOS CLIENT — SHARED BY ALL ROLES

```typescript
// api/client.ts
import axios, { AxiosError } from 'axios'
import { useAuthStore } from '@/stores/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

// Attach token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Refresh on 401 with queue to prevent parallel refresh calls
let isRefreshing = false
type QueueCallback = (token: string) => void
let queue: QueueCallback[] = []

const processQueue = (token: string) => {
  queue.forEach((cb) => cb(token))
  queue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean }
    if (error.response?.status !== 401 || original?._retry) {
      return Promise.reject(error)
    }
    original._retry = true

    if (isRefreshing) {
      return new Promise((resolve) => {
        queue.push((token) => {
          original.headers!.Authorization = `Bearer ${token}`
          resolve(api(original))
        })
      })
    }

    isRefreshing = true
    const { refreshToken, setAccessToken, clearAuth } = useAuthStore.getState()

    try {
      const { data } = await axios.post(
        import.meta.env.VITE_API_URL + '/api/v1/auth/refresh',
        { refreshToken }
      )
      setAccessToken(data.accessToken)
      processQueue(data.accessToken)
      original.headers!.Authorization = `Bearer ${data.accessToken}`
      return api(original)
    } catch {
      clearAuth()
      window.location.replace('/login')
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)

// Helper type for API errors
export interface ApiError {
  error: {
    code: string
    message: string
    details?: Array<{ field: string; issue: string }>
    requestId: string
  }
}
```

---

## COMMON TYPES

```typescript
// types/common.ts
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type YearLevel = 'FY' | 'SY' | 'TY' | 'FINAL'

export interface Batch {
  id: string
  code: string
  yearLevel: YearLevel
  studentCount?: number
}

export interface Subject {
  id: string
  code: string
  name: string
  credits?: number
  type?: 'THEORY' | 'PRACTICAL' | 'LAB' | 'TUTORIAL'
}

export interface Phase {
  id: string
  label: string          // "T1", "T2"
  number: number         // 1, 2, 3, 4
  examDate?: string
  isComplete: boolean
}

export interface Semester {
  id: string
  label: string          // "Semester 3"
  number: number
  yearLevel: YearLevel
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETE'
}

export interface AcademicYear {
  id: string
  label: string          // "2026-27"
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
}

export interface Announcement {
  id: string
  title: string
  body: string
  senderName: string
  senderRole: 'HOD' | 'FACULTY'
  scope: 'ALL' | 'BATCH' | 'YEAR_LEVEL'
  scopeLabel?: string
  isRead: boolean
  createdAt: string
}

export interface CalendarEvent {
  id: string
  date: string
  title: string
  type: 'HOLIDAY' | 'EXAM' | 'CULTURAL' | 'PHASE' | 'OTHER'
  description?: string
}

export interface ChatMessage {
  id: string
  senderRole: 'FACULTY' | 'STUDENT'
  senderName: string
  content: string
  isRead: boolean
  sentAt: string
}

export interface AttendanceSummary {
  subjectId: string
  subjectCode: string
  subjectName: string
  totalLectures: number
  attended: number
  percentage: number
  status: 'OK' | 'WARNING' | 'AT_RISK'
  isBelowThreshold: boolean
}
```

---

## SHARED COMPONENTS IN DETAIL

### Components ALL THREE ROLES use

These must be generic enough to accept data from any role's API response.

**`AttendancePctCell`** — used in HOD table, Faculty table, Student subject cards
```tsx
interface AttendancePctCellProps {
  pct: number
  threshold?: number   // default 75
  showBar?: boolean    // default true
}
// Renders: progress bar + colored percentage text
// Color: ≥85% green, 75-84% orange, <75% red
```

**`PhaseTimeline`** — used in HOD dashboard, Faculty dashboard, Student calendar
```tsx
interface PhaseTimelineProps {
  phases: Phase[]
  compact?: boolean    // compact=true for sidebar widget, false for full view
}
```

**`CalendarGrid`** — used in HOD calendar page, Faculty calendar page, Student calendar page
```tsx
interface CalendarGridProps {
  events: CalendarEvent[]
  year: number
  month: number          // 0-indexed
  onDayClick?: (date: string) => void       // HOD/Faculty: opens add modal
  onEventClick?: (event: CalendarEvent) => void
  readonly?: boolean     // true for Student (cannot add events)
}
```

**`AnnouncementFeed`** — used in all three roles (different data, same component)
```tsx
interface AnnouncementFeedProps {
  announcements: Announcement[]
  isLoading: boolean
  onMarkRead?: (id: string) => void
  onMarkAllRead?: () => void
  showUnreadBadge?: boolean
}
```

**`ChatWindow`** — used by Faculty (in MenteesPage) and Student (in MentorChatPage)
```tsx
interface ChatWindowProps {
  mentorAssignmentId: string
  currentUserRole: 'FACULTY' | 'STUDENT'
  partnerName: string
  partnerAvatar?: string
  isOnline: boolean
  messages: ChatMessage[]
  onSend: (content: string) => void
  isLoadingMore: boolean
  onLoadMore: () => void
}
```

**`FileDrop`** — used by HOD (students, faculty, results, mentorship CSVs) and Faculty (notes upload)
```tsx
interface FileDropProps {
  accept: Record<string, string[]>    // e.g. { 'text/csv': ['.csv'] }
  maxSizeMb?: number
  onDrop: (file: File) => void
  icon?: string                       // emoji or icon
  title?: string
  subtitle?: string
  disabled?: boolean
}
```

---

## SCOPE HOOKS — ONE PER ROLE

```typescript
// hooks/hod/useHodScope.ts
// Every HOD page that renders batch/subject dropdowns calls this first
export function useHodScope(semesterId?: string) {
  return useQuery({
    queryKey: ['hod-scope', semesterId ?? 'active'],
    queryFn: () => api.get('/hod/my-scope', { params: { semesterId } }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })
}
// Returns: { batches: Batch[], uniqueSubjects: Subject[], totalStudents, totalFaculty, activeSemester }
```

```typescript
// hooks/faculty/useFacultyScope.ts
// Every Faculty page calls this to know their assigned batches + subjects
export function useFacultyScope(semesterId?: string) {
  return useQuery({
    queryKey: ['faculty-scope', semesterId ?? 'active'],
    queryFn: () => api.get('/faculty/my-scope', { params: { semesterId } }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })
}
// Returns: { assignments, uniqueBatches, uniqueSubjects, totalStudents, mentorCode, activeSemester }
```

```typescript
// hooks/student/useStudentEnrollment.ts
// Every Student page calls this for context (batch, rollNo, semester)
export function useStudentEnrollment() {
  return useQuery({
    queryKey: ['student-enrollment-current'],
    queryFn: () => api.get('/student/enrollment/current').then(r => r.data),
    staleTime: 30 * 60 * 1000,  // enrollment rarely changes mid-session
  })
}
// Returns: { semesterLabel, yearLevel, batchCode, rollNo, academicYear }
```

---

## SOCKET.IO HOOK — SHARED BETWEEN FACULTY AND STUDENT

```typescript
// hooks/shared/useSocket.ts
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/authStore'

let socketInstance: Socket | null = null

export function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!accessToken) return
    if (!socketInstance) {
      socketInstance = io(import.meta.env.VITE_SOCKET_URL, {
        auth: { token: accessToken },
        transports: ['websocket'],
        reconnectionAttempts: 5,
      })
    }
    socketRef.current = socketInstance

    // Heartbeat for presence
    const ping = setInterval(() => socketInstance?.emit('ping'), 30_000)
    return () => clearInterval(ping)
  }, [accessToken])

  return socketRef.current
}

// Only Faculty and Student use Socket.io (for mentor chat)
// HOD does NOT need Socket.io — no real-time features
```

---

## LOGIN PAGE — THREE ROLES, ONE FORM

```typescript
// pages/auth/LoginPage.tsx
// Role selector tabs: HOD | Faculty | Student
// On submit → POST /auth/login → store tokens → redirect based on role

function handleLoginSuccess(response: LoginResponse) {
  useAuthStore.getState().setAuth({
    user: response.user,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    isFirstLogin: response.user.isFirstLogin,
  })

  // Redirect based on role
  if (response.user.role === 'FACULTY') {
    navigate(response.user.isHod ? '/hod' : '/faculty')
  } else {
    navigate('/student')
  }

  // First login → go to settings/security to change password
  if (response.user.isFirstLogin) {
    const base = response.user.role === 'STUDENT' ? '/student' : response.user.isHod ? '/hod' : '/faculty'
    navigate(`${base}/settings/security`)
  }
}
```

---

## API HOOKS — PATTERN TO FOLLOW FOR ALL THREE ROLES

```typescript
// STANDARD READ HOOK
export function useStudentList(filters: StudentFilters) {
  return useQuery({
    queryKey: ['hod', 'students', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Student>>('/hod/students', { params: filters })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

// STANDARD MUTATION HOOK
export function useUploadStudentCSV() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (fd: FormData) =>
      api.post('/hod/students/csv', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(r => r.data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['hod', 'students'] })
      toast.success(`${result.inserted} inserted, ${result.updated} updated`)
    },
    onError: (err: AxiosError<ApiError>) => {
      toast.error(err.response?.data?.error?.message ?? 'Upload failed')
    },
  })
}

// QUERY KEY CONVENTION — namespace by role to prevent cache collisions
// HOD:     ['hod', 'students', filters]
// Faculty: ['faculty', 'students', filters]
// Student: ['student', 'attendance']
// Shared:  ['auth', 'me']
```

---

## SETTINGS PAGES — ROLE-SPECIFIC BUT SIMILAR STRUCTURE

All three roles have a Settings page with a left settings-nav. They share the same layout pattern but different sections:

**HOD Settings sections:**
Profile | University | Semesters & Years | Notifications | Security | Attendance Rules | Danger Zone

**Faculty Settings sections:**
Profile | Notifications | Security

**Student Settings sections:**
Profile | Security

The `SettingsPage.tsx` for each role uses the same `SettingsNav` + URL-driven section pattern (`/hod/settings/profile`, `/faculty/settings/security`, `/student/settings/profile`).

---

## PAGES THAT SHARE COMPONENTS — VISUAL GUIDE

| Component | HOD | Faculty | Student |
|---|---|---|---|
| `CalendarGrid` | ✅ full CRUD | ✅ view + own events | ✅ view only |
| `AnnouncementFeed` | ✅ compose + view | ✅ compose + view | ✅ view + mark read |
| `ChatWindow` | ❌ | ✅ with each mentee | ✅ with mentor |
| `AttendancePctCell` | ✅ in student table | ✅ in student table | ✅ per subject |
| `PhaseTimeline` | ✅ in dashboard | ✅ in dashboard | ✅ in calendar |
| `FileDrop` | ✅ CSV uploads | ✅ notes upload | ❌ |
| `StatCard` | ✅ 5 on dashboard | ✅ 4 on dashboard | ✅ 4 on dashboard |
| `Badge` | ✅ everywhere | ✅ everywhere | ✅ everywhere |
| `AttendanceTrendChart` | ✅ analytics | ✅ analytics | ❌ |
| `MarksBarChart` | ✅ dashboard + analytics | ✅ analytics | ❌ |
| `CSVPreview` | ✅ upload modals | ❌ | ❌ |

---

## PAGES UNIQUE TO EACH ROLE

**HOD only:** Students CRUD, Faculty CRUD, Results upload (4-step wizard), Mentorship assign, Promotion wizard, Analytics deep-dive (5 tabs), Subjects management

**Faculty only:** My Schedule (timetable), Mark Attendance, Upload Notes, Create Quiz, Mentees list (portal into per-mentee profile with chat)

**Student only:** AI Assistant, Study Planner, Self Notes, Quiz attempt + review, Leaderboard, Mentor Chat (single mentor — simpler than faculty's mentee list)

---

## SCOPING ENFORCED IN FRONTEND

### HOD
- All batch/subject dropdowns populated from `useHodScope().data.batches`
- Never allow free-text batch IDs — always picker from scoped list
- If `hodScope.batches.length === 0` → show empty state, not error

### Faculty
- All batch/subject dropdowns from `useFacultyScope().data.uniqueBatches`
- Student list filtered by assigned batch before rendering
- Quiz creation subject selector from `useFacultyScope().data.uniqueSubjects`
- Attendance marking: batch selector only shows assigned batches

### Student
- All data is auto-scoped server-side — no batch selector needed on student pages
- Student cannot navigate to another student's data — no cross-student links
- Results only rendered when `isPublished: true`

---

## LOADING SKELETONS — CONSISTENT ACROSS ALL ROLES

```typescript
// components/ui/Skeleton.tsx
// Use these — no custom loading divs per page

export function StatCardSkeleton() { /* 5 pulsing stat card shapes */ }
export function TableSkeleton({ rows = 5, cols = 6 }) { /* N pulsing table rows */ }
export function ChartSkeleton({ height = 200 }) { /* pulsing rectangle */ }
export function CardSkeleton({ height = 120 }) { /* pulsing card */ }
export function AvatarSkeleton({ size = 32 }) { /* pulsing circle */ }

// Usage in any page:
const { data, isLoading } = useStudentList(filters)
if (isLoading) return <TableSkeleton rows={8} cols={8} />
```

---

## ENVIRONMENT VARIABLES

```bash
# .env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=ws://localhost:3001
VITE_APP_NAME=UniPortal

# .env.production
VITE_API_URL=https://lju.api.uniportal.in
VITE_SOCKET_URL=wss://lju.api.uniportal.in
VITE_APP_NAME=UniPortal
```

---

## BUILD ORDER — SCALABLE SPRINT PLAN

### Sprint 0 — Foundation (build this before any pages)
1. Vite + React + TypeScript + Tailwind + shadcn setup
2. `tailwind.config.ts` with all color tokens
3. `api/client.ts` — Axios + refresh interceptors
4. `stores/authStore.ts` + `stores/uiStore.ts`
5. `types/common.ts` — shared types used by all roles
6. `router/index.tsx` + `ProtectedRoute` + `RoleRouter`
7. `components/layout/` — AppShell + Sidebar + Topbar + navItems for all 3 roles
8. All `components/ui/` primitives — Card, StatCard, Badge, Button, Modal, FileDrop, Table, Pagination, Avatar, ProgressBar, Spinner, Skeleton, EmptyState, Stepper, Tabs, Toggle
9. `components/shared/` — CalendarGrid, ChatWindow, AnnouncementFeed, AttendancePctCell, PhaseTimeline, FileDrop, CSVPreview
10. `pages/auth/LoginPage.tsx` — fully wired, all 3 role tabs

### Sprint 1 — HOD Portal (highest priority — manages all data)
11. `hooks/hod/useHodScope.ts`
12. HOD: Dashboard → Students → Faculty → Results → Attendance → Subjects → Mentorship → Analytics → Promotion → Calendar → Settings

### Sprint 2 — Faculty Portal
13. `hooks/faculty/useFacultyScope.ts`
14. `hooks/shared/useSocket.ts`
15. Faculty: Dashboard → Schedule → Students (view) → Attendance → Notes → Quizzes → Announcements → Mentees (+ Chat) → Results (view) → Calendar → Analytics → Settings

### Sprint 3 — Student Portal
16. `hooks/student/useStudentEnrollment.ts`
17. Student: Dashboard → Timetable → Results → Attendance → Notes (view) → Self Notes → Quizzes → Announcements → Calendar → Mentor Chat → AI Assistant → Study Planner → Leaderboard → Settings

---

## HOW TO USE THIS PROMPT

Paste this document as the first message. Then work through sprints in order.

For Sprint 0: *"Start Sprint 0. Build `api/client.ts`, `stores/authStore.ts`, and `types/common.ts`."*

For each shared component: *"Build `components/shared/ChatWindow.tsx`. It must work for both Faculty (chatting with a mentee) and Student (chatting with their mentor). The `currentUserRole` prop determines bubble alignment."*

For each role page: *"Build `pages/faculty/AttendancePage.tsx`. Wire it to `GET /faculty/attendance/session`, `POST /faculty/attendance`, and `PATCH /faculty/attendance`. Use `useFacultyScope` for the batch/subject selectors. Reference Faculty_API.md Section 5 for the full API contract."*

Reference documents to always keep open:
- `API.md` — HOD endpoints
- `Faculty_API.md` — Faculty endpoints
- `Student_API.md` — Student endpoints
- `HOD_SCOPING.md` — batch scoping rules
