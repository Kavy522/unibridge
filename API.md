# UniPortal — REST API Reference
> Express backend · Page-wise endpoint documentation · v1

**Base URL:** `https://{university-slug}.api.uniportal.in/api/v1`
**Auth:** All endpoints (except `/auth/login`) require `Authorization: Bearer <accessToken>` header.
**Content-Type:** `application/json` unless stated otherwise (multipart for file uploads).
**Pagination:** List endpoints accept `?page=1&limit=20`, response includes `{ data, total, page, limit, totalPages }`.
**Errors:** All errors return `{ "error": { "code": "STRING_CODE", "message": "Human readable", "details": [...] } }` with appropriate HTTP status.

---

## Table of Contents

1. [Auth & Session](#1-auth--session)
2. [Dashboard](#2-dashboard)
3. [Students Page](#3-students-page)
4. [Faculty Page](#4-faculty-page)
5. [Results Page](#5-results-page)
6. [Attendance Page](#6-attendance-page)
7. [Subjects Page](#7-subjects-page)
8. [Mentorship Page](#8-mentorship-page)
9. [Analytics Page](#9-analytics-page)
10. [Promotion Page](#10-promotion-page)
11. [Calendar Page](#11-calendar-page)
12. [Settings Page](#12-settings-page)
13. [Common Error Codes](#13-common-error-codes)

---

## 1. Auth & Session

### `POST /auth/login`
Authenticates HOD, Faculty, or Student.

**Auth required:** No

**Request Body**
```json
{
  "email": "rajesh.patel@lju.edu.in",
  "password": "SecurePass123",
}
```
`role` is one of `HOD | FACULTY | STUDENT`. For STUDENT, `email` may also be the `enrollment_no`.

**Response `200 OK`**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "8f14e45fceea167a5a36...",
  "expiresIn": 900,
  "user": {
    "id": "f3a1c2b0-...",
    "name": "Dr. Rajesh Patel",
    "email": "rajesh.patel@lju.edu.in",
    "role": "FACULTY",
    "isHod": true,
    "universityId": "univ_lju_01",
    "department": "IT",
    "mentorCode": null
  }
}
```

**Errors**
| Status | Code | Cause |
|---|---|---|
| 401 | `INVALID_CREDENTIALS` | Wrong email/password |
| 403 | `ACCOUNT_INACTIVE` | `isActive = false` |
| 404 | `UNIVERSITY_NOT_FOUND` | Subdomain doesn't resolve to a tenant |

---

### `POST /auth/refresh`
Exchanges a valid refresh token for a new access token.

**Auth required:** No (refresh token in body)

**Request Body**
```json
{ "refreshToken": "8f14e45fceea167a5a36..." }
```

**Response `200 OK`**
```json
{ "accessToken": "eyJhbGciOiJIUzI1NiIs...", "expiresIn": 900 }
```

**Errors:** `401 REFRESH_TOKEN_EXPIRED`, `401 REFRESH_TOKEN_INVALID`

---

### `POST /auth/logout`
Revokes the current refresh token.

**Auth required:** Yes

**Request Body**
```json
{ "refreshToken": "8f14e45fceea167a5a36..." }
```

**Response `204 No Content`**

---

### `POST /auth/forgot-password`
Sends a password reset link (HOD/Faculty only — students contact HOD).

**Request Body**
```json
{ "email": "rajesh.patel@lju.edu.in" }
```

**Response `200 OK`**
```json
{ "message": "If this email exists, a reset link has been sent." }
```
*(Always returns 200 regardless of whether the email exists, to prevent user enumeration.)*

---

### `GET /auth/me`
Returns the currently authenticated user's profile.

**Auth required:** Yes

**Response `200 OK`**
```json
{
  "id": "f3a1c2b0-...",
  "name": "Dr. Rajesh Patel",
  "email": "rajesh.patel@lju.edu.in",
  "role": "FACULTY",
  "isHod": true,
  "department": "IT",
  "employeeId": "EMP001",
  "profilePhotoUrl": null,
  "university": { "id": "univ_lju_01", "name": "LJ University", "slug": "lju" }
}
```

---

## 2. Dashboard

### `GET /hod/dashboard/summary`
Powers the 5 stat cards at the top of the Dashboard page.

**Auth required:** Yes (HOD)

**Query Params:** `?academicYearId=&semesterId=` (defaults to active year/semester)

**Response `200 OK`**
```json
{
  "totalStudents": { "value": 3458, "deltaLabel": "+120 this semester", "trend": "up" },
  "totalFaculty": { "value": 72, "deltaLabel": "No change", "trend": "neutral" },
  "activeBatches": { "value": 148, "deltaLabel": "+6 this semester", "trend": "up" },
  "avgAttendance": { "value": 94.2, "deltaLabel": "+3.4% vs last month", "trend": "up" },
  "resultsUploadedPct": { "value": 78, "deltaLabel": "T2 Completed", "trend": "neutral" }
}
```

---

### `GET /hod/dashboard/attendance-trend`
Powers the "Attendance Trend" line chart.

**Query Params:** `?months=6` (default 6)

**Response `200 OK`**
```json
{
  "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  "data": [78, 81, 85, 88, 86, 91]
}
```

---

### `GET /hod/dashboard/results-overview`
Powers the phase-wise "Results Overview" bar chart.

**Query Params:** `?semesterId=`

**Response `200 OK`**
```json
{
  "phases": [
    { "phase": "T1", "avgMarksPct": 72, "status": "complete" },
    { "phase": "T2", "avgMarksPct": 74, "status": "complete" },
    { "phase": "T3", "avgMarksPct": 78, "status": "complete" },
    { "phase": "T4", "avgMarksPct": null, "status": "pending" }
  ]
}
```

---

### `GET /hod/dashboard/at-risk`
Powers the "At Risk Students" table (top N, dashboard preview).

**Query Params:** `?limit=5` (Analytics page uses the full version, see §9)

**Response `200 OK`**
```json
{
  "data": [
    {
      "enrollmentNo": "LJ20IT045",
      "name": "Kavy Thakar",
      "batchCode": "C2",
      "attendancePct": 68,
      "avgMarksPct": 35,
      "status": "Needs Attention"
    }
  ],
  "total": 47
}
```

---

### `GET /hod/dashboard/activity-feed`
Powers "Recent Activities".

**Query Params:** `?page=1&limit=10`

**Response `200 OK`**
```json
{
  "data": [
    {
      "id": "act_88231",
      "type": "RESULT_UPLOAD",
      "icon": "📋",
      "title": "T2 Result uploaded",
      "description": "T2 results for 12 subjects uploaded.",
      "actorName": "Dr. Rajesh Patel",
      "createdAt": "2026-06-30T10:32:00Z"
    }
  ],
  "total": 184, "page": 1, "limit": 10, "totalPages": 19
}
```

---

## 3. Students Page

### `GET /hod/students`
List/search/filter students with pagination.

**Query Params**
| Param | Type | Description |
|---|---|---|
| `search` | string | matches name or enrollmentNo |
| `yearLevel` | enum | `FY \| SY \| TY \| FINAL` |
| `batchId` | uuid | filter by current batch |
| `branch` | string | `IT \| CSE \| CE \| AIML \| RAI` |
| `status` | enum | `ACTIVE \| AT_RISK \| INACTIVE` |
| `semesterId` | uuid | defaults to active semester |
| `page`, `limit` | int | pagination |

**Response `200 OK`**
```json
{
  "data": [
    {
      "id": "stu_4521",
      "enrollmentNo": "24002170210127",
      "name": "Kavy Thakar",
      "branch": "IT",
      "currentBatch": { "id": "batch_c2", "code": "C2" },
      "currentSemester": { "id": "sem_3", "label": "Semester 3" },
      "currentRollNo": "IT-24-045",
      "attendancePct": 68,
      "status": "AT_RISK"
    }
  ],
  "total": 3458, "page": 1, "limit": 20, "totalPages": 173
}
```

---

### `GET /hod/students/:enrollmentNo`
Full student profile, used by the "View Profile" modal.

**Response `200 OK`**
```json
{
  "enrollmentNo": "24002170210127",
  "name": "Kavy Thakar",
  "email": "kavy@lj.edu",
  "phone": "9876543210",
  "branch": "IT",
  "admissionYear": 2023,
  "status": "AT_RISK",
  "currentEnrollment": {
    "batchCode": "C2",
    "semesterLabel": "Semester 3",
    "yearLevel": "SY",
    "rollNo": "IT-24-045",
    "attendancePct": 68
  }
}
```

---

### `GET /hod/students/:enrollmentNo/history`
Powers the "Academic Journey" timeline in the student detail modal.

**Response `200 OK`**
```json
{
  "enrollmentNo": "24002170210127",
  "journey": [
    { "semesterNumber": 1, "yearLevel": "FY", "batchCode": "B3", "rollNo": "IT-23-012", "academicYear": "2023-24" },
    { "semesterNumber": 2, "yearLevel": "FY", "batchCode": "B1", "rollNo": "IT-23-045", "academicYear": "2023-24" },
    { "semesterNumber": 3, "yearLevel": "SY", "batchCode": "C2", "rollNo": "IT-24-045", "academicYear": "2024-25", "promotedFromEnrollmentId": "enr_881" }
  ]
}
```

---

### `POST /hod/students`
Create a single student manually (rarely used — bulk CSV is primary path).

**Request Body**
```json
{
  "enrollmentNo": "24002170210127",
  "name": "New Student",
  "email": "new.student@lj.edu",
  "branch": "IT",
  "phone": "9999900000",
  "admissionYear": 2026
}
```

**Response `201 Created`**
```json
{
  "id": "stu_9981",
  "enrollmentNo": "24002170210127",
  "name": "New Student",
  "temporaryPassword": "LJ26IT401@123"
}
```

**Errors:** `409 ENROLLMENT_NO_ALREADY_EXISTS`

---

### `PUT /hod/students/:enrollmentNo`
Full update of a student's permanent profile fields (not enrollment/batch — see §10 Promotion for that).

**Request Body**
```json
{
  "name": "Kavy A. Thakar",
  "email": "kavy.thakar@lj.edu",
  "phone": "9876543211",
  "branch": "IT"
}
```

**Response `200 OK`** — returns updated student object (same shape as `GET /hod/students/:enrollmentNo`)

---

### `PATCH /hod/students/:enrollmentNo/status`
Toggle active/inactive (e.g., student dropped out).

**Request Body**
```json
{ "isActive": false, "reason": "Dropped out — transferred to another institution" }
```

**Response `200 OK`**
```json
{ "enrollmentNo": "24002170210127", "isActive": false }
```

---

### `DELETE /hod/students/:enrollmentNo`
Soft-deletes a student (sets `deletedAt`). Historical records (results, attendance) are preserved.

**Response `204 No Content`**

**Errors:** `409 STUDENT_HAS_ACTIVE_ENROLLMENT` if not first deactivated

---

### `POST /hod/students/csv`
Bulk upload via CSV (Upload Students modal).

**Request:** `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| `file` | File | `.csv` — columns: `enrollment_no, name, email, branch, phone` |
| `semesterId` | string | target semester to enroll into |
| `batchId` | string | target batch |

**Response `200 OK`**
```json
{
  "inserted": 47,
  "updated": 3,
  "errors": [
    { "row": 12, "enrollmentNo": "24002170210127", "reason": "Invalid branch code" }
  ]
}
```

---

### `GET /hod/students/csv/template`
Downloads the CSV template file.

**Response `200 OK`** — `Content-Type: text/csv`, file body

---

### `GET /hod/students/export`
Exports filtered student list as CSV.

**Query Params:** same filters as `GET /hod/students`

**Response `200 OK`** — `Content-Type: text/csv`, file download

---

## 4. Faculty Page

### `GET /hod/faculty`
List/search/filter faculty.

**Query Params:** `search`, `department`, `role` (`FACULTY|HOD`), `status`, `page`, `limit`

**Response `200 OK`**
```json
{
  "data": [
    {
      "id": "fac_002",
      "employeeId": "EMP002",
      "name": "Dr. Mehul Rana",
      "department": "IT",
      "isHod": false,
      "mentorCode": "SYD",
      "subjectCount": 2,
      "menteeCount": 28,
      "status": "ACTIVE"
    }
  ],
  "total": 72, "page": 1, "limit": 10, "totalPages": 8
}
```

---

### `GET /hod/faculty/:employeeId`
Full faculty profile (detail modal).

**Response `200 OK`**
```json
{
  "employeeId": "EMP002",
  "name": "Dr. Mehul Rana",
  "email": "mehul.rana@lj.edu",
  "phone": "9876500002",
  "department": "IT",
  "isHod": false,
  "mentorCode": "SYD",
  "menteeCount": 28,
  "subjects": [
    { "code": "TOC", "name": "Theory of Computation", "batches": ["C2", "B1"] },
    { "code": "FSD-2", "name": "Full Stack Development 2", "batches": ["C2"] }
  ],
  "status": "ACTIVE"
}
```

---

### `POST /hod/faculty`
Create a single faculty member manually.

**Request Body**
```json
{
  "employeeId": "EMP073",
  "name": "Dr. New Faculty",
  "email": "new.faculty@lj.edu",
  "department": "IT",
  "isHod": false,
  "phone": "9999911111"
}
```

**Response `201 Created`**
```json
{ "id": "fac_073", "employeeId": "EMP073", "temporaryPassword": "EMP073@123" }
```

---

### `PUT /hod/faculty/:employeeId`
Full profile update.

**Request Body**
```json
{
  "name": "Dr. Mehul A. Rana",
  "email": "mehul.rana@lj.edu",
  "phone": "9876500099",
  "department": "IT"
}
```

**Response `200 OK`** — updated faculty object

---

### `PATCH /hod/faculty/:employeeId/mentor-code`
Update a faculty's mentor code (used in faculty detail modal's "Update Mentor Code" field).

**Request Body**
```json
{ "mentorCode": "MRN" }
```

**Response `200 OK`**
```json
{ "employeeId": "EMP002", "mentorCode": "MRN" }
```

**Errors:** `400 CANNOT_SET_MENTOR_CODE_FOR_HOD`, `409 MENTOR_CODE_ALREADY_IN_USE`

---

### `PATCH /hod/faculty/:employeeId/status`
Activate/deactivate a faculty account.

**Request Body**
```json
{ "isActive": false }
```

**Response `200 OK`**
```json
{ "employeeId": "EMP002", "status": "INACTIVE" }
```

---

### `DELETE /hod/faculty/:employeeId`
Soft-delete. Blocked if faculty has active subject assignments or mentees.

**Response `204 No Content`**

**Errors:** `409 FACULTY_HAS_ACTIVE_ASSIGNMENTS`

---

### `POST /hod/faculty/csv`
Bulk upload faculty.

**Request:** `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| `file` | File | columns: `employee_id, name, email, department, is_hod, phone` |

**Response `200 OK`**
```json
{ "inserted": 14, "updated": 0, "errors": [] }
```

---

### `POST /hod/faculty/assignments`
Assign a faculty to teach a subject in a batch (Assign Subjects modal).

**Request Body**
```json
{
  "facultyId": "fac_002",
  "subjectId": "subj_coa",
  "batchId": "batch_c2",
  "semesterId": "sem_3"
}
```

**Response `201 Created`**
```json
{
  "id": "fba_551",
  "faculty": { "id": "fac_002", "name": "Dr. Mehul Rana" },
  "subject": { "code": "COA" },
  "batch": { "code": "C2" }
}
```

**Errors:** `409 ASSIGNMENT_ALREADY_EXISTS`

---

### `DELETE /hod/faculty/assignments/:assignmentId`
Remove a faculty-subject-batch assignment.

**Response `204 No Content`**

---

### `GET /hod/faculty/export`
Export filtered faculty list as CSV.

**Response `200 OK`** — CSV file

---

## 5. Results Page

### `GET /hod/results/upload-context`
Returns cascading dropdown data for the 4-step upload wizard.

**Query Params:** `?academicYearId=&semesterId=`

**Response `200 OK`**
```json
{
  "academicYears": [{ "id": "ay_2627", "label": "2026-27" }],
  "semesters": [{ "id": "sem_3", "label": "Semester 3", "number": 3 }],
  "phases": [
    { "id": "ph_t1", "label": "T1", "number": 1, "isActive": false, "isComplete": true },
    { "id": "ph_t2", "label": "T2", "number": 2, "isActive": true, "isComplete": false },
    { "id": "ph_t3", "label": "T3", "number": 3, "isActive": false, "isComplete": false },
    { "id": "ph_t4", "label": "T4", "number": 4, "isActive": false, "isComplete": false }
  ],
  "subjects": [{ "id": "subj_coa", "code": "COA", "name": "Computer Organization & Architecture" }],
  "batches": [{ "id": "batch_c2", "code": "C2" }]
}
```

---

### `GET /hod/results/students`
Returns enrolled students for the selected phase/subject/batch — used for Manual Entry mode.

**Query Params:** `?semesterId=&batchId=&subjectId=` (required)

**Response `200 OK`**
```json
{
  "data": [
    { "enrollmentId": "enr_4521", "enrollmentNo": "24002170210127", "name": "Kavy Thakar", "existingMarks": null }
  ]
}
```

---

### `POST /hod/results/upload`
Upload results via CSV (Step 3, CSV mode).

**Request:** `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| `file` | File | columns: `enrollment_no, marks_obtained, max_marks, grade` |
| `phaseId` | string | required |
| `subjectId` | string | required |
| `batchId` | string | required |

**Response `200 OK`**
```json
{
  "totalRows": 50,
  "inserted": 50,
  "updated": 0,
  "errors": [],
  "summary": { "avgMarks": 74.2, "belowPassCount": 4, "studentCount": 50 }
}
```

**Errors:** `400 ENROLLMENT_NOT_IN_BATCH` (row-level, included in `errors[]`)

---

### `POST /hod/results/manual`
Submit results entered manually (Step 3, Manual Entry mode).

**Request Body**
```json
{
  "phaseId": "ph_t2",
  "subjectId": "subj_coa",
  "batchId": "batch_c2",
  "results": [
    { "enrollmentId": "enr_4521", "marksObtained": 35, "maxMarks": 100, "grade": "F" },
    { "enrollmentId": "enr_4522", "marksObtained": 62, "maxMarks": 100, "grade": "C" }
  ]
}
```

**Response `200 OK`**
```json
{ "inserted": 2, "updated": 0, "summary": { "avgMarks": 48.5, "belowPassCount": 1 } }
```

---

### `GET /hod/results/preview`
Returns a draft preview before publish (Step 4).

**Query Params:** `?phaseId=&subjectId=&batchId=`

**Response `200 OK`**
```json
{
  "studentCount": 50,
  "avgMarks": 74.2,
  "belowPassCount": 4,
  "isPublished": false,
  "results": [
    { "enrollmentNo": "24002170210127", "name": "Kavy Thakar", "marksObtained": 35, "maxMarks": 100, "grade": "F", "status": "Fail" }
  ]
}
```

---

### `POST /hod/results/publish`
Publishes uploaded results, making them visible to students (Step 4 — irreversible).

**Request Body**
```json
{ "phaseId": "ph_t2", "subjectId": "subj_coa", "batchId": "batch_c2" }
```

**Response `200 OK`**
```json
{ "published": true, "publishedAt": "2026-06-30T11:00:00Z", "studentCount": 50 }
```

**Errors:** `409 RESULTS_ALREADY_PUBLISHED`, `400 INCOMPLETE_RESULTS` (not all students have marks)

---

### `GET /hod/results/upload-history`
Powers the "Upload History" sidebar panel.

**Query Params:** `?semesterId=&page=1&limit=10`

**Response `200 OK`**
```json
{
  "data": [
    {
      "phase": "T2", "subjectCode": "COA", "batchCode": "C2",
      "uploadedAt": "2026-05-28T00:00:00Z",
      "uploadedBy": "Dr. Rajesh Patel", "studentCount": 50
    }
  ],
  "total": 5
}
```

---

### `GET /hod/results/phase-status`
Powers the "Phase Completion Status" panel.

**Query Params:** `?semesterId=`

**Response `200 OK`**
```json
{
  "phases": [
    { "phase": "T1", "subjectsTotal": 5, "subjectsUploaded": 5, "status": "Complete" },
    { "phase": "T2", "subjectsTotal": 5, "subjectsUploaded": 3, "status": "In Progress" },
    { "phase": "T3", "subjectsTotal": 5, "subjectsUploaded": 0, "status": "Pending" },
    { "phase": "T4", "subjectsTotal": 5, "subjectsUploaded": 0, "status": "Pending" }
  ]
}
```

---

### `PATCH /hod/results/:resultId`
Edit a single student's result (correction after publish).

**Request Body**
```json
{ "marksObtained": 78, "grade": "B" }
```

**Response `200 OK`**
```json
{ "id": "res_88123", "marksObtained": 78, "grade": "B", "updatedAt": "2026-06-30T11:10:00Z" }
```

---

### `DELETE /hod/results/:resultId`
Delete a single erroneous result row.

**Response `204 No Content`**

---

## 6. Attendance Page

### `GET /hod/attendance/summary`
Powers the 4 stat cards.

**Query Params:** `?semesterId=`

**Response `200 OK`**
```json
{
  "overallAvgPct": 87.3,
  "deltaLabel": "+2.1% this month",
  "belowThresholdCount": 47,
  "totalLectures": 1840,
  "lockedRecordsPct": 60
}
```

---

### `GET /hod/attendance/heatmap`
Powers the Heatmap view — student × subject matrix.

**Query Params:** `?batchId=&semesterId=` (required)

**Response `200 OK`**
```json
{
  "subjects": ["COA", "DM", "FCSP-2", "FSD-2", "TOC"],
  "students": [
    {
      "enrollmentNo": "24002170210127",
      "name": "Kavy Thakar",
      "perSubjectPct": [68, 72, 65, 70, 71],
      "avgPct": 69
    }
  ]
}
```

---

### `GET /hod/attendance/table`
Powers the Table view (same data, list shape, with lock state and pagination).

**Query Params:** `?batchId=&semesterId=&search=&page=1&limit=20`

**Response `200 OK`**
```json
{
  "data": [
    {
      "enrollmentNo": "24002170210127",
      "name": "Kavy Thakar",
      "perSubject": { "COA": 68, "DM": 72, "FCSP-2": 65, "FSD-2": 70, "TOC": 71 },
      "avgPct": 69,
      "status": "AT_RISK",
      "isLocked": false
    }
  ],
  "total": 50, "page": 1, "limit": 20, "totalPages": 3
}
```

---

### `GET /hod/attendance/by-subject`
Powers the "By Subject" tab summary list + trend chart.

**Query Params:** `?batchId=&semesterId=`

**Response `200 OK`**
```json
{
  "subjects": [
    { "code": "COA", "avgPct": 85 },
    { "code": "DM", "avgPct": 88 },
    { "code": "FCSP-2", "avgPct": 79 },
    { "code": "FSD-2", "avgPct": 91 },
    { "code": "TOC", "avgPct": 83 }
  ]
}
```

---

### `POST /faculty/attendance`
Faculty marks attendance for a lecture (used by Faculty portal; HOD can view results here).

**Request Body**
```json
{
  "subjectId": "subj_coa",
  "batchId": "batch_c2",
  "lectureDate": "2026-06-30",
  "attendance": [
    { "enrollmentId": "enr_4521", "isPresent": false },
    { "enrollmentId": "enr_4522", "isPresent": true }
  ]
}
```

**Response `201 Created`**
```json
{ "recordsCreated": 2, "lectureDate": "2026-06-30", "subjectCode": "COA" }
```

**Errors:** `403 NOT_ASSIGNED_TO_BATCH`, `409 ATTENDANCE_RECORD_LOCKED`

---

### `PATCH /hod/attendance/lock`
Lock attendance records for a subject+batch (prevents further faculty edits).

**Request Body**
```json
{ "subjectId": "subj_coa", "batchId": "batch_c2", "semesterId": "sem_3" }
```

**Response `200 OK`**
```json
{ "lockedCount": 50, "isLocked": true }
```

---

### `PATCH /hod/attendance/unlock`
Unlock a specific student's record (single-row toggle, used by the lock-button in table view).

**Request Body**
```json
{ "enrollmentId": "enr_4521", "subjectId": "subj_coa" }
```

**Response `200 OK`**
```json
{ "enrollmentNo": "24002170210127", "isLocked": false }
```

---

### `PATCH /hod/attendance/lock-all`
Locks every attendance record for the active batch/semester ("Lock All" button).

**Request Body**
```json
{ "semesterId": "sem_3", "batchId": "batch_c2" }
```

**Response `200 OK`**
```json
{ "lockedCount": 250 }
```

---

### `GET /hod/attendance/export`
Exports the attendance report as CSV.

**Query Params:** `?batchId=&semesterId=`

**Response `200 OK`** — CSV file

---

### `GET /student/attendance`
Student-facing — returns the calling student's own attendance (used by Student portal).

**Query Params:** `?semesterId=`

**Response `200 OK`**
```json
{
  "subjects": [
    { "subjectCode": "COA", "totalLectures": 24, "attended": 19, "percentage": 79.16, "isBelowThreshold": false }
  ]
}
```

---

## 7. Subjects Page

### `GET /hod/subjects`
List subjects for a given semester.

**Query Params:** `?semesterId=&search=&type=`

**Response `200 OK`**
```json
{
  "data": [
    {
      "id": "subj_coa",
      "code": "COA",
      "name": "Computer Organization & Architecture",
      "credits": 4,
      "type": "Theory",
      "assignedFaculty": { "id": "fac_002", "name": "Dr. Mehul Rana" },
      "batches": ["C2", "B1", "B3"],
      "pyqUploaded": true
    }
  ],
  "summary": { "totalSubjects": 5, "totalCredits": 20, "assignedCount": 4, "unassignedCount": 1 }
}
```

---

### `GET /hod/subjects/:subjectId`
Single subject detail (edit modal).

**Response `200 OK`**
```json
{
  "id": "subj_coa",
  "code": "COA",
  "name": "Computer Organization & Architecture",
  "credits": 4,
  "type": "Theory",
  "semesterId": "sem_3"
}
```

---

### `POST /hod/subjects`
Add a new subject for a semester.

**Request Body**
```json
{
  "semesterId": "sem_3",
  "code": "COA",
  "name": "Computer Organization & Architecture",
  "credits": 4,
  "type": "Theory",
  "facultyId": "fac_002",
  "batchIds": ["batch_c2", "batch_b1", "batch_b3"]
}
```

**Response `201 Created`**
```json
{ "id": "subj_coa", "code": "COA", "name": "Computer Organization & Architecture" }
```

**Errors:** `409 SUBJECT_CODE_EXISTS_IN_SEMESTER`

---

### `PUT /hod/subjects/:subjectId`
Full update of a subject.

**Request Body**
```json
{ "code": "COA", "name": "Computer Organization & Architecture", "credits": 4, "type": "Theory" }
```

**Response `200 OK`** — updated subject object

---

### `DELETE /hod/subjects/:subjectId`
Delete a subject. Blocked if it has results or attendance already recorded.

**Response `204 No Content`**

**Errors:** `409 SUBJECT_HAS_RESULTS_OR_ATTENDANCE`

---

### `POST /hod/subjects/copy`
Copy subjects from one semester to another ("Copy from Semester" modal).

**Request Body**
```json
{ "fromSemesterId": "sem_1", "toSemesterId": "sem_3" }
```

**Response `200 OK`**
```json
{ "copiedCount": 5, "skippedCount": 0 }
```

---

### `POST /hod/subjects/:subjectId/pyq`
Upload Previous Year Question PDFs for a subject (feeds Phase 4 AI analysis).

**Request:** `multipart/form-data`
| Field | Type |
|---|---|
| `files` | File[] (PDFs) |

**Response `200 OK`**
```json
{ "uploaded": 3, "subjectId": "subj_coa", "processingStatus": "queued" }
```

---

## 8. Mentorship Page

### `GET /hod/mentorship/summary`
Powers the 4 stat cards.

**Query Params:** `?semesterId=`

**Response `200 OK`**
```json
{ "activeMentors": 12, "studentsAssigned": 248, "unassignedStudents": 14, "avgMenteesPerMentor": 20.7 }
```

---

### `GET /hod/mentorship/mentors`
Powers "Mentor Cards" view — list of faculty mentors with their mentee list.

**Query Params:** `?semesterId=`

**Response `200 OK`**
```json
{
  "data": [
    {
      "facultyId": "fac_002",
      "name": "Dr. Mehul Rana",
      "department": "IT",
      "mentorCode": "SYD",
      "menteeCount": 28,
      "mentees": [
        { "enrollmentNo": "24002170210127", "name": "Kavy Thakar" },
        { "enrollmentNo": "24002170210128", "name": "Het Patel" }
      ]
    }
  ]
}
```

---

### `GET /hod/mentorship/assignments`
Powers "Assignment Table" view — flat student-to-mentor list.

**Query Params:** `?semesterId=&search=&mentorCode=&page=1&limit=20`

**Response `200 OK`**
```json
{
  "data": [
    {
      "enrollmentNo": "24002170210127",
      "studentName": "Kavy Thakar",
      "batchCode": "C2",
      "mentorName": "Dr. Mehul Rana",
      "mentorCode": "SYD"
    }
  ],
  "total": 248, "page": 1, "limit": 20, "totalPages": 13
}
```

---

### `GET /hod/mentorship/unassigned`
Powers "Unassigned Students" tab.

**Query Params:** `?semesterId=`

**Response `200 OK`**
```json
{
  "data": [
    { "enrollmentNo": "24002170210127", "name": "Raj Trivedi", "batchCode": "C2", "branch": "IT" }
  ],
  "total": 14
}
```

---

### `POST /hod/mentorship/assign`
Assign a single student to a mentor.

**Request Body**
```json
{ "studentEnrollmentNo": "24002170210127", "facultyId": "fac_002", "semesterId": "sem_3" }
```

**Response `201 Created`**
```json
{
  "id": "ma_8821",
  "mentorCode": "SYD",
  "student": { "enrollmentNo": "24002170210127", "name": "Kavy Thakar" },
  "faculty": { "id": "fac_002", "name": "Dr. Mehul Rana" }
}
```

**Errors:** `400 CANNOT_ASSIGN_TO_HOD`, `409 STUDENT_ALREADY_HAS_MENTOR_THIS_SEMESTER`

---

### `POST /hod/mentorship/assign/csv`
Bulk mentor assignment via CSV.

**Request:** `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| `file` | File | columns: `enrollment_no, mentor_code` |
| `semesterId` | string | |

**Response `200 OK`**
```json
{
  "assigned": 248,
  "errors": [
    { "row": 17, "enrollmentNo": "24002170210127", "reason": "Mentor code RXY not found for any faculty" }
  ]
}
```

---

### `PATCH /hod/mentorship/reassign`
Reassign a student to a different mentor.

**Request Body**
```json
{ "studentEnrollmentNo": "24002170210127", "newFacultyId": "fac_010", "semesterId": "sem_3" }
```

**Response `200 OK`**
```json
{ "enrollmentNo": "24002170210127", "newMentorCode": "VKM" }
```

---

### `POST /hod/mentorship/auto-assign`
Auto-distribute unassigned students evenly across existing mentors.

**Request Body**
```json
{ "semesterId": "sem_3" }
```

**Response `200 OK`**
```json
{ "assignedCount": 14, "distribution": [{ "mentorCode": "SYD", "newCount": 3 }, { "mentorCode": "RKP", "newCount": 4 }] }
```

---

### `DELETE /hod/mentorship/assignments/:assignmentId`
Remove a mentor-student assignment (student becomes unassigned).

**Response `204 No Content`**

---

## 9. Analytics Page

### `GET /hod/analytics/kpi`
Powers the 5 top KPI cards.

**Query Params:** `?semesterId=&batchId=`

**Response `200 OK`**
```json
{
  "avgAttendance": { "value": 87.3, "deltaLabel": "+2.1%" },
  "avgMarksLatestPhase": { "value": 74.2, "phaseLabel": "T2", "deltaLabel": "+3.8%" },
  "atRiskCount": { "value": 47, "deltaLabel": "+5 new" },
  "passRateLatestPhase": { "value": 91.2, "phaseLabel": "T2", "deltaLabel": "+0.8%" },
  "topScorer": { "name": "Sena Raval", "avgPct": 96.4 }
}
```

---

### `GET /hod/analytics/attendance/trend`
Attendance trend chart, per batch, last N months.

**Query Params:** `?semesterId=&months=6`

**Response `200 OK`**
```json
{
  "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  "series": [
    { "batchCode": "C2", "data": [82, 84, 86, 88, 87, 90] },
    { "batchCode": "B1", "data": [78, 80, 83, 85, 84, 88] }
  ]
}
```

---

### `GET /hod/analytics/attendance/by-subject`
Subject-wise average attendance bar chart.

**Query Params:** `?semesterId=&batchId=`

**Response `200 OK`**
```json
{ "subjects": [{ "code": "COA", "avgPct": 85 }, { "code": "DM", "avgPct": 88 }] }
```

---

### `GET /hod/analytics/attendance/distribution`
Histogram of students by attendance bucket.

**Query Params:** `?semesterId=&batchId=`

**Response `200 OK`**
```json
{
  "buckets": [
    { "range": "< 60%", "count": 12 },
    { "range": "60–74%", "count": 35 },
    { "range": "75–84%", "count": 180 },
    { "range": "85–94%", "count": 420 },
    { "range": "≥ 95%", "count": 253 }
  ]
}
```

---

### `GET /hod/analytics/marks/by-phase`
Phase-wise average marks, broken down per subject.

**Query Params:** `?semesterId=&batchId=`

**Response `200 OK`**
```json
{
  "phases": ["T1", "T2", "T3", "T4"],
  "series": [
    { "subjectCode": "COA", "data": [68, 72, null, null] },
    { "subjectCode": "DM", "data": [71, 74, null, null] }
  ]
}
```

---

### `GET /hod/analytics/marks/by-subject`
Average marks per subject for a given phase.

**Query Params:** `?phaseId=&batchId=`

**Response `200 OK`**
```json
{ "subjects": [{ "code": "COA", "avgMarksPct": 72 }, { "code": "DM", "avgMarksPct": 78 }] }
```

---

### `GET /hod/analytics/marks/grade-distribution`
Grade bucket histogram for a phase.

**Query Params:** `?phaseId=&batchId=`

**Response `200 OK`**
```json
{
  "buckets": [
    { "grade": "A+ (≥90)", "count": 42 },
    { "grade": "A (80–89)", "count": 98 },
    { "grade": "B (70–79)", "count": 180 },
    { "grade": "C (60–69)", "count": 120 },
    { "grade": "D (50–59)", "count": 56 },
    { "grade": "F (<50)", "count": 4 }
  ]
}
```

---

### `GET /hod/analytics/leaderboard`
Top-ranked students for a phase/batch.

**Query Params:** `?phaseId=&batchId=&limit=10`

**Response `200 OK`**
```json
{
  "data": [
    { "rank": 1, "enrollmentNo": "24002170210127", "name": "Sena Raval", "batchCode": "D1", "avgPct": 96.4 },
    { "rank": 2, "enrollmentNo": "24002070210128", "name": "Aneri Dave", "batchCode": "B3", "avgPct": 91.2 }
  ]
}
```

---

### `GET /hod/analytics/performance-radar`
Top-10 vs bottom-10 average per subject, for the radar chart.

**Query Params:** `?phaseId=&batchId=`

**Response `200 OK`**
```json
{
  "subjects": ["COA", "DM", "FCSP-2", "FSD-2", "TOC"],
  "topAvg": [88, 91, 85, 93, 87],
  "bottomAvg": [52, 55, 48, 60, 50]
}
```

---

### `GET /hod/analytics/at-risk`
Full at-risk report (Analytics tab — paginated, filterable; differs from dashboard's preview).

**Query Params:** `?semesterId=&batchId=&riskFactor=BOTH|ATTENDANCE|MARKS&page=1&limit=20`

**Response `200 OK`**
```json
{
  "data": [
    {
      "enrollmentNo": "24002170210127", "name": "Kavy Thakar", "batchCode": "C2",
      "mentorCode": "SYD", "avgAttendancePct": 68, "latestPhaseMarksPct": 35,
      "riskFactor": "BOTH"
    }
  ],
  "total": 47, "page": 1, "limit": 20, "totalPages": 3
}
```

---

### `POST /hod/analytics/at-risk/notify-mentor`
Sends a notification to the student's mentor flagging them as at-risk.

**Request Body**
```json
{ "enrollmentNo": "24002170210127" }
```

**Response `200 OK`**
```json
{ "notified": true, "mentorCode": "SYD" }
```

---

### `GET /hod/analytics/year-comparison`
Year-over-year subject performance comparison.

**Query Params:** `?currentSemesterId=&compareSemesterId=`

**Response `200 OK`**
```json
{
  "subjects": ["COA", "DM", "FCSP-2", "FSD-2", "TOC"],
  "current": { "label": "2026-27", "data": [72, 78, 65, 81, 69] },
  "compare": { "label": "2025-26", "data": [68, 72, 64, 75, 67] },
  "attendanceComparison": { "current": 87.3, "compare": 84.2 },
  "passRateComparison": { "current": 91.2, "compare": 88.7 }
}
```

---

### `GET /hod/analytics/export`
Export full analytics report as PDF.

**Query Params:** `?semesterId=&batchId=`

**Response `200 OK`** — `Content-Type: application/pdf`, file download

---

## 10. Promotion Page

### `GET /hod/promotion/years`
Lists available source/target academic years for the wizard.

**Response `200 OK`**
```json
{
  "years": [
    { "id": "ay_2526", "label": "2025-26", "status": "ACTIVE", "studentCount": 920 },
    { "id": "ay_2627", "label": "2026-27", "status": "READY", "studentCount": 0 }
  ]
}
```

---

### `GET /hod/promotion/preview`
Returns students grouped by current batch/year-level, plus available target batches — powers Step 2.

**Query Params:** `?fromAcademicYearId=&toAcademicYearId=` (required)

**Response `200 OK`**
```json
{
  "fromYearLabel": "2025-26",
  "toYearLabel": "2026-27",
  "groups": [
    {
      "yearLevel": "FY",
      "targetYearLevel": "SY",
      "students": [
        { "enrollmentNo": "24002170210127", "name": "Pratik Joshi", "fromBatchCode": "A1", "fromSemesterLabel": "Sem 2 (FY)" }
      ],
      "availableTargetBatches": [{ "id": "batch_c2", "code": "C2" }, { "id": "batch_d1", "code": "D1" }]
    },
    {
      "yearLevel": "SY",
      "targetYearLevel": "TY",
      "students": [
        { "enrollmentNo": "24002170210127", "name": "Kavy Thakar", "fromBatchCode": "C2", "fromSemesterLabel": "Sem 4 (SY)" }
      ],
      "availableTargetBatches": [{ "id": "batch_g1", "code": "G1" }, { "id": "batch_g2", "code": "G2" }]
    }
  ],
  "unmappedCount": 2
}
```

---

### `POST /hod/promotion/mapping/csv`
Bulk batch mapping upload (Step 2, "Upload Mapping CSV").

**Request:** `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| `file` | File | columns: `enrollment_no, new_batch_code` |
| `toAcademicYearId` | string | |

**Response `200 OK`**
```json
{
  "mapped": 48,
  "errors": [
    { "row": 9, "enrollmentNo": "24002170210127", "reason": "Batch code 'Z9' does not exist in target year" }
  ]
}
```

---

### `PUT /hod/promotion/mapping`
Save/update the in-progress mapping draft (each dropdown change in Step 2 can call this, or it's batched).

**Request Body**
```json
{
  "fromAcademicYearId": "ay_2526",
  "toAcademicYearId": "ay_2627",
  "mappings": [
    { "enrollmentNo": "24002170210127", "toBatchId": "batch_g1" },
    { "enrollmentNo": "24002170210128", "toBatchId": "batch_c2" }
  ]
}
```

**Response `200 OK`**
```json
{ "savedCount": 2, "draftId": "draft_991" }
```

---

### `GET /hod/promotion/roll-numbers/suggest`
Step 3 — Auto-suggest new roll numbers based on branch + target batch pattern.

**Query Params:** `?draftId=`

**Response `200 OK`**
```json
{
  "suggestions": [
    { "enrollmentNo": "24002170210127", "suggestedRollNo": "IT-25-001" },
    { "enrollmentNo": "24002170210129", "suggestedRollNo": "CSE-25-001" }
  ]
}
```

---

### `POST /hod/promotion/roll-numbers/csv`
Bulk roll number assignment via CSV (Step 3).

**Request:** `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| `file` | File | columns: `enrollment_no, new_roll_no, new_batch_code` |
| `draftId` | string | |

**Response `200 OK`**
```json
{ "assigned": 50, "errors": [] }
```

---

### `GET /hod/promotion/preview-summary`
Step 4 — final preview before executing the promotion.

**Query Params:** `?draftId=`

**Response `200 OK`**
```json
{
  "totalStudents": 50,
  "mappedStudents": 48,
  "heldStudents": 2,
  "byBatch": [
    { "toBatchCode": "C2", "count": 25 },
    { "toBatchCode": "G1", "count": 23 }
  ]
}
```

---

### `POST /hod/promotion/execute`
Executes the promotion — creates new `StudentEnrollment` rows, marks old ones `isCurrent: false`. **Irreversible.**

**Request Body**
```json
{
  "draftId": "draft_991",
  "fromAcademicYearId": "ay_2526",
  "toAcademicYearId": "ay_2627",
  "mappings": [
    {
      "enrollmentNo": "24002170210127",
      "fromEnrollmentId": "enr_881",
      "toSemesterId": "sem_5",
      "toBatchId": "batch_g1",
      "toRollNo": "IT-25-001"
    }
  ]
}
```

**Response `200 OK`**
```json
{
  "promoted": 48,
  "skipped": 2,
  "executedAt": "2026-06-30T12:00:00Z",
  "executedBy": "Dr. Rajesh Patel"
}
```

**Errors:** `400 INCOMPLETE_MAPPING`, `409 TARGET_SEMESTER_NOT_IN_TARGET_YEAR`

---

### `GET /hod/promotion/history`
Audit log of past promotion executions.

**Query Params:** `?page=1&limit=10`

**Response `200 OK`**
```json
{
  "data": [
    { "id": "promo_445", "fromYear": "2024-25", "toYear": "2025-26", "promotedCount": 902, "executedAt": "2025-07-01T09:00:00Z", "executedBy": "Dr. Rajesh Patel" }
  ],
  "total": 2
}
```

---

## 11. Calendar Page

### `GET /hod/calendar/events`
List events for a date range (powers the month grid).

**Query Params:** `?year=2026&month=7` (1-indexed month) or `?startDate=&endDate=`

**Response `200 OK`**
```json
{
  "data": [
    { "id": "evt_201", "date": "2026-07-04", "title": "T3 Phase Start", "type": "PHASE" },
    { "id": "evt_202", "date": "2026-07-14", "title": "Independence Day", "type": "HOLIDAY" }
  ]
}
```

---

### `GET /hod/calendar/events/upcoming`
Powers the "Upcoming Events" sidebar.

**Query Params:** `?limit=6`

**Response `200 OK`**
```json
{
  "data": [
    { "id": "evt_201", "date": "2026-07-04", "title": "T3 Phase Start", "type": "PHASE" }
  ]
}
```

---

### `GET /hod/calendar/events/:eventId`
Single event detail.

**Response `200 OK`**
```json
{
  "id": "evt_202",
  "title": "Independence Day",
  "date": "2026-07-14",
  "endDate": "2026-07-14",
  "type": "HOLIDAY",
  "description": null,
  "visibleTo": "ALL",
  "createdBy": "Dr. Rajesh Patel"
}
```

---

### `POST /hod/calendar/events`
Create a calendar event.

**Request Body**
```json
{
  "title": "Diwali Holiday",
  "startDate": "2026-10-20",
  "endDate": "2026-10-22",
  "type": "HOLIDAY",
  "visibleTo": "ALL",
  "description": "University closed for Diwali festival",
  "semesterId": "sem_3"
}
```
`type` is one of `HOLIDAY | EXAM | CULTURAL | PHASE | OTHER`. `visibleTo` is one of `ALL | FACULTY_HOD | HOD_ONLY`.

**Response `201 Created`**
```json
{ "id": "evt_310", "title": "Diwali Holiday", "startDate": "2026-10-20" }
```

---

### `PUT /hod/calendar/events/:eventId`
Update an event.

**Request Body**
```json
{ "title": "Diwali Holidays", "startDate": "2026-10-20", "endDate": "2026-10-23", "type": "HOLIDAY" }
```

**Response `200 OK`** — updated event object

---

### `DELETE /hod/calendar/events/:eventId`
Delete an event.

**Response `204 No Content`**

---

### `GET /hod/calendar/phase-timeline`
Powers the "Phase Timeline" sidebar widget.

**Query Params:** `?semesterId=`

**Response `200 OK`**
```json
{
  "phases": [
    { "label": "T1", "startDate": "2026-02-01", "endDate": "2026-03-15", "examDate": "2026-03-20", "isComplete": true },
    { "label": "T2", "startDate": "2026-03-21", "endDate": "2026-05-10", "examDate": "2026-05-15", "isComplete": true },
    { "label": "T3", "startDate": "2026-07-04", "endDate": "2026-08-20", "examDate": "2026-08-25", "isComplete": false },
    { "label": "T4", "startDate": "2026-09-01", "endDate": "2026-10-15", "examDate": "2026-10-20", "isComplete": false }
  ]
}
```

---

### `GET /hod/calendar/export`
Export the academic calendar as PDF.

**Query Params:** `?academicYearId=`

**Response `200 OK`** — `Content-Type: application/pdf`, file download

---

## 12. Settings Page

### `GET /hod/settings/profile`
Returns the HOD's own profile (My Profile tab).

**Response `200 OK`**
```json
{
  "employeeId": "EMP001",
  "name": "Dr. Rajesh Patel",
  "email": "rajesh.patel@lju.edu.in",
  "phone": "9876543210",
  "department": "Information Technology",
  "profilePhotoUrl": null
}
```

---

### `PUT /hod/settings/profile`
Update own profile.

**Request Body**
```json
{ "name": "Dr. Rajesh Patel", "email": "rajesh.patel@lju.edu.in", "phone": "9876543210" }
```

**Response `200 OK`** — updated profile object

---

### `POST /hod/settings/profile/photo`
Upload profile photo.

**Request:** `multipart/form-data`
| Field | Type |
|---|---|
| `file` | File (image) |

**Response `200 OK`**
```json
{ "profilePhotoUrl": "https://s3.../profiles/fac_001.jpg" }
```

---

### `GET /hod/settings/university`
Returns university-level configuration (University tab).

**Response `200 OK`**
```json
{
  "name": "LJ University",
  "slug": "lju",
  "website": "https://ljku.edu.in",
  "contactEmail": "admin@ljku.edu.in",
  "address": "Nr. Sarkhej–Gandhinagar Hwy, Ahmedabad, Gujarat 382210",
  "branches": ["IT", "CSE", "CE", "AIML", "RAI"],
  "academicYearPattern": "JULY_APRIL",
  "plan": "PRO"
}
```

---

### `PUT /hod/settings/university`
Update university configuration.

**Request Body**
```json
{
  "name": "LJ University",
  "website": "https://ljku.edu.in",
  "contactEmail": "admin@ljku.edu.in",
  "address": "Nr. Sarkhej–Gandhinagar Hwy, Ahmedabad, Gujarat 382210",
  "academicYearPattern": "JULY_APRIL"
}
```

**Response `200 OK`** — updated config

---

### `POST /hod/settings/university/branches`
Add a new branch (e.g., adding "EC" - Electronics).

**Request Body**
```json
{ "code": "EC", "name": "Electronics & Communication" }
```

**Response `201 Created`**
```json
{ "branches": ["IT", "CSE", "CE", "AIML", "RAI", "EC"] }
```

---

### `GET /hod/settings/academic-years`
List all academic years with their semesters (Semesters & Years tab).

**Response `200 OK`**
```json
{
  "data": [
    {
      "id": "ay_2627", "label": "2026-27", "status": "ACTIVE",
      "semesters": [
        { "id": "sem_3", "number": 3, "label": "Semester 3", "status": "ACTIVE" },
        { "id": "sem_4", "number": 4, "label": "Semester 4", "status": "UPCOMING" }
      ]
    }
  ]
}
```

---

### `POST /hod/settings/academic-years`
Create a new academic year.

**Request Body**
```json
{ "label": "2027-28", "startDate": "2027-07-01", "endDate": "2028-04-30" }
```

**Response `201 Created`**
```json
{ "id": "ay_2728", "label": "2027-28", "status": "DRAFT" }
```

---

### `PATCH /hod/settings/academic-years/:yearId/activate`
Marks a year as the active one (only one active at a time).

**Response `200 OK`**
```json
{ "id": "ay_2627", "status": "ACTIVE" }
```

---

### `POST /hod/settings/academic-years/:yearId/semesters`
Add a semester to a year ("+ Add Semester").

**Request Body**
```json
{ "number": 4, "yearLevel": "SY", "startDate": "2026-09-01", "endDate": "2026-12-15" }
```

**Response `201 Created`**
```json
{ "id": "sem_4", "number": 4, "label": "Semester 4" }
```

---

### `GET /hod/settings/notifications`
Returns notification preference toggles.

**Response `200 OK`**
```json
{
  "preferences": [
    { "key": "RESULT_UPLOADED", "label": "Result uploaded by HOD", "enabled": true },
    { "key": "NEW_ENROLLMENT", "label": "New student enrollment", "enabled": true },
    { "key": "AT_RISK_ALERT", "label": "At-risk student alert", "enabled": true },
    { "key": "FACULTY_ATTENDANCE_LOG", "label": "Faculty logs attendance", "enabled": false },
    { "key": "MENTOR_CHAT_MESSAGE", "label": "Mentor chat messages", "enabled": false },
    { "key": "CALENDAR_REMINDER", "label": "Academic calendar events", "enabled": true },
    { "key": "PROMOTION_COMPLETED", "label": "Promotion completed", "enabled": true }
  ]
}
```

---

### `PUT /hod/settings/notifications`
Update notification preferences.

**Request Body**
```json
{
  "preferences": [
    { "key": "RESULT_UPLOADED", "enabled": true },
    { "key": "FACULTY_ATTENDANCE_LOG", "enabled": true }
  ]
}
```

**Response `200 OK`** — updated preferences list

---

### `PATCH /hod/settings/security/password`
Change password.

**Request Body**
```json
{ "currentPassword": "OldPass123", "newPassword": "NewSecurePass456" }
```

**Response `200 OK`**
```json
{ "message": "Password updated successfully" }
```

**Errors:** `401 CURRENT_PASSWORD_INCORRECT`, `400 PASSWORD_TOO_WEAK`

---

### `GET /hod/settings/security/sessions`
List active login sessions.

**Response `200 OK`**
```json
{
  "data": [
    { "id": "sess_1", "device": "Chrome on Windows", "ip": "103.21.44.xx", "location": "Ahmedabad", "isCurrent": true, "lastActive": "2026-06-30T12:00:00Z" },
    { "id": "sess_2", "device": "Safari on iPhone 14", "ip": "103.21.44.xx", "isCurrent": false, "lastActive": "2026-06-30T10:00:00Z" }
  ]
}
```

---

### `DELETE /hod/settings/security/sessions/:sessionId`
Revoke a specific session.

**Response `204 No Content`**

---

### `GET /hod/settings/attendance-rules`
Returns configured attendance thresholds.

**Response `200 OK`**
```json
{
  "minThresholdPct": 75,
  "warningThresholdPct": 80,
  "autoNotifyMentor": true,
  "autoLockAfterDays": 7
}
```

---

### `PUT /hod/settings/attendance-rules`
Update attendance rule configuration.

**Request Body**
```json
{ "minThresholdPct": 75, "warningThresholdPct": 80, "autoNotifyMentor": true, "autoLockAfterDays": 7 }
```

**Response `200 OK`** — updated rules object

---

### `POST /hod/settings/danger/reset-mentor-assignments`
Bulk-clears all mentor-student links for the active semester.

**Request Body**
```json
{ "semesterId": "sem_3", "confirm": true }
```

**Response `200 OK`**
```json
{ "clearedCount": 248 }
```

---

### `DELETE /hod/settings/danger/attendance-records`
Bulk-deletes attendance records for a semester. Blocked if any record is locked.

**Request Body**
```json
{ "semesterId": "sem_3", "confirm": true }
```

**Response `200 OK`**
```json
{ "deletedCount": 0, "blocked": true, "reason": "1,840 records are locked. Unlock before deleting." }
```

---

### `POST /hod/settings/danger/archive-year`
Generates a full data export/archive of an academic year.

**Request Body**
```json
{ "academicYearId": "ay_2526" }
```

**Response `202 Accepted`**
```json
{ "jobId": "archive_job_771", "status": "queued", "estimatedTimeSeconds": 45 }
```

---

### `GET /hod/settings/danger/archive-status/:jobId`
Poll archive job status.

**Response `200 OK`**
```json
{ "jobId": "archive_job_771", "status": "complete", "downloadUrl": "https://s3.../archives/2025-26-lju.zip" }
```

---

## 13. Common Error Codes

| HTTP Status | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request body failed schema validation; `details[]` lists field errors |
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 401 | `TOKEN_EXPIRED` | Access token expired — call `/auth/refresh` |
| 403 | `FORBIDDEN` | Authenticated but lacks permission (e.g., Faculty calling HOD-only route) |
| 403 | `TENANT_MISMATCH` | Resource belongs to a different university |
| 404 | `NOT_FOUND` | Resource doesn't exist or was soft-deleted |
| 409 | `CONFLICT` | Generic uniqueness/state conflict — see endpoint-specific codes above |
| 422 | `UNPROCESSABLE_CSV` | CSV file structurally invalid (wrong columns, corrupt encoding) |
| 429 | `RATE_LIMITED` | Too many requests — see `Retry-After` header |
| 500 | `INTERNAL_ERROR` | Unexpected server error — logged with `requestId` for support |

**Standard error response shape:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "marksObtained", "issue": "must be a number between 0 and maxMarks" }
    ],
    "requestId": "req_a1b2c3d4"
  }
}
```

---

## Notes on Conventions Used Throughout

Every list endpoint follows the same pagination envelope: `data`, `total`, `page`, `limit`, `totalPages`. Endpoints scoped to "current" semester/year default to whatever the university has marked active, but accept explicit `semesterId`/`academicYearId` overrides so the frontend can browse historical data without special-casing.

CSV upload endpoints always return the same three-key shape — counts of what changed plus a row-level `errors[]` array — so the frontend's upload-preview UI is reusable across Students, Faculty, Results, Mentorship, and Promotion pages.

Routes prefixed `/hod/` enforce `requireRole('HOD')` middleware (checking `isHod: true` on the Faculty record) before the controller runs. Routes prefixed `/faculty/` or `/student/` are reachable by any authenticated user of that role, scoped to their own data via `req.user.id`.