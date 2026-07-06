import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import LoginPage from '@/pages/auth/LoginPage'
import PlaceholderPage from '@/pages/PlaceholderPage'
import RouteError from '@/components/RouteError'
import ProtectedRoute from './ProtectedRoute'
import RoleRouter from './RoleRouter'

// HOD portal pages
import HodDashboard from '@/pages/hod/DashboardPage'
import HodStudents from '@/pages/hod/StudentsPage'
import HodFaculty from '@/pages/hod/FacultyPage'
import HodResults from '@/pages/hod/ResultsPage'
import HodAttendance from '@/pages/hod/AttendancePage'
import HodSubjects from '@/pages/hod/SubjectsPage'
import HodMentorship from '@/pages/hod/MentorshipPage'
import HodAnalytics from '@/pages/hod/AnalyticsPage'
import HodPromotion from '@/pages/hod/PromotionPage'
import HodCalendar from '@/pages/hod/CalendarPage'
import HodSettings from '@/pages/hod/SettingsPage'

// A placeholder factory keeps routes wired before real pages land.
const stub = (title: string, subtitle?: string) => (
  <PlaceholderPage title={title} subtitle={subtitle} />
)

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        errorElement: <RouteError />,
        children: [
          // ── HOD ─────────────────────────────
          { path: '/hod', element: <HodDashboard /> },
          { path: '/hod/students', element: <HodStudents /> },
          { path: '/hod/faculty', element: <HodFaculty /> },
          { path: '/hod/results', element: <HodResults /> },
          { path: '/hod/attendance', element: <HodAttendance /> },
          { path: '/hod/subjects', element: <HodSubjects /> },
          { path: '/hod/mentorship', element: <HodMentorship /> },
          { path: '/hod/analytics', element: <HodAnalytics /> },
          { path: '/hod/promotion', element: <HodPromotion /> },
          { path: '/hod/calendar', element: <HodCalendar /> },
          { path: '/hod/settings/:section?', element: <HodSettings /> },

          // ── Faculty ─────────────────────────
          { path: '/faculty', element: stub('Dashboard', 'Faculty overview') },
          { path: '/faculty/schedule', element: stub('My Schedule') },
          { path: '/faculty/students', element: stub('Students') },
          { path: '/faculty/attendance', element: stub('Attendance') },
          { path: '/faculty/notes', element: stub('Notes') },
          { path: '/faculty/quizzes', element: stub('Quizzes') },
          { path: '/faculty/announcements', element: stub('Announcements') },
          { path: '/faculty/mentees', element: stub('Mentees') },
          { path: '/faculty/results', element: stub('Results') },
          { path: '/faculty/calendar', element: stub('Calendar') },
          { path: '/faculty/analytics', element: stub('Analytics') },
          { path: '/faculty/settings/:section?', element: stub('Settings') },

          // ── Student ─────────────────────────
          { path: '/student', element: stub('Dashboard', 'Student overview') },
          { path: '/student/timetable', element: stub('Timetable') },
          { path: '/student/results', element: stub('Results') },
          { path: '/student/attendance', element: stub('Attendance') },
          { path: '/student/notes', element: stub('Notes') },
          { path: '/student/self-notes', element: stub('My Notes') },
          { path: '/student/quizzes', element: stub('Quizzes') },
          { path: '/student/announcements', element: stub('Announcements') },
          { path: '/student/calendar', element: stub('Calendar') },
          { path: '/student/mentor', element: stub('Mentor Chat') },
          { path: '/student/ai', element: stub('AI Assistant') },
          { path: '/student/study-planner', element: stub('Study Planner') },
          { path: '/student/leaderboard', element: stub('Leaderboard') },
          { path: '/student/settings/:section?', element: stub('Settings') },

          // Root redirect + catch-all
          { path: '/', element: <RoleRouter /> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
])
