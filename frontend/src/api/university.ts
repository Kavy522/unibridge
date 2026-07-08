import { api } from './client'

// University (Dean) portal — backend mount is /admin.

export interface UniOverview {
  university: { name: string; slug: string; plan: string }
  activeYear: { id: string; label: string } | null
  activeSemester: { id: string; label: string; number: number } | null
  counts: { students: number; faculty: number; hods: number; batches: number; currentEnrollments: number }
  branchBreakdown: { branch: string; count: number }[]
  recentActivity: { id: string; type: string; title: string; description: string; by: string; createdAt: string }[]
}

export interface UniSemester {
  id: string; number: number; label: string; yearLevel: string; status: string; startDate: string; endDate: string
}
export interface UniBatch { id: string; code: string; yearLevel: string; studentCount: number }
export interface UniYear {
  id: string; label: string; status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'; startDate: string; endDate: string
  semesters: UniSemester[]; batches: UniBatch[]
}

export interface UniHod {
  id: string; name: string; email: string; employeeId: string; department: string; isActive: boolean
  scopes: { batchId: string; batchCode: string; semesterLabel: string }[]
}
export interface UniHodsResponse {
  activeSemester: { id: string; label: string } | null
  hods: UniHod[]
  batches: { id: string; code: string; yearLevel: string; ownedBy: string | null }[]
  facultyOptions: { id: string; name: string; employeeId: string; department: string }[]
}

export interface UniFacultyRow {
  id: string; name: string; email: string; employeeId: string; department: string
  isHod: boolean; mentorCode: string | null; isActive: boolean
}
export interface UniStudentRow {
  id: string; enrollmentNo: string; name: string; email: string; branch: string; admissionYear: number
  isActive: boolean; batchCode: string | null; semesterLabel: string | null; rollNo: string | null
}
export interface Paged<T> { data: T[]; total: number; page: number; totalPages: number }

export const universityApi = {
  overview: () => api.get<UniOverview>('/admin/overview').then((r) => r.data),

  years: () => api.get<{ data: UniYear[] }>('/admin/years').then((r) => r.data),
  createYear: (body: { label: string; startDate: string; endDate: string }) => api.post('/admin/years', body).then((r) => r.data),
  activateYear: (id: string) => api.post(`/admin/years/${id}/activate`).then((r) => r.data),
  createSemester: (body: { academicYearId: string; number: number; startDate: string; endDate: string }) => api.post('/admin/semesters', body).then((r) => r.data),
  activateSemester: (id: string) => api.post(`/admin/semesters/${id}/activate`).then((r) => r.data),
  createBatch: (body: { academicYearId: string; code: string; yearLevel: string }) => api.post('/admin/batches', body).then((r) => r.data),

  hods: () => api.get<UniHodsResponse>('/admin/hods').then((r) => r.data),
  setHod: (facultyId: string, isHod: boolean) => api.post(`/admin/hods/${facultyId}/toggle`, { isHod }).then((r) => r.data),
  assignScope: (facultyId: string, batchId: string) => api.post('/admin/hod-scope', { facultyId, batchId }).then((r) => r.data),
  removeScope: (batchId: string) => api.delete(`/admin/hod-scope/${batchId}`).then((r) => r.data),

  faculty: (params: { search?: string; page?: number }) => api.get<Paged<UniFacultyRow>>('/admin/faculty', { params }).then((r) => r.data),
  createFaculty: (body: Record<string, unknown>) => api.post('/admin/faculty', body).then((r) => r.data),
  setFacultyActive: (id: string, isActive: boolean) => api.patch(`/admin/faculty/${id}/active`, { isActive }).then((r) => r.data),

  students: (params: { search?: string; branch?: string; page?: number }) => api.get<Paged<UniStudentRow>>('/admin/students', { params }).then((r) => r.data),
  setStudentActive: (id: string, isActive: boolean) => api.patch(`/admin/students/${id}/active`, { isActive }).then((r) => r.data),

  branches: () => api.get<{ data: { id: string; code: string; name: string; studentCount: number }[]; orphanBranches: { branch: string; count: number }[] }>('/admin/branches').then((r) => r.data),
  createBranch: (body: { code: string; name: string }) => api.post('/admin/branches', body).then((r) => r.data),
  deleteBranch: (id: string) => api.delete(`/admin/branches/${id}`).then((r) => r.data),

  settings: () => api.get<{ name: string; slug: string; logoUrl: string | null; website: string | null; contactEmail: string | null; address: string | null; plan: string }>('/admin/settings').then((r) => r.data),
  updateSettings: (body: Record<string, unknown>) => api.put('/admin/settings', body).then((r) => r.data),
}
