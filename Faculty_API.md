# UniPortal — Faculty API Reference
> Express backend · All endpoints needed by the Faculty portal · v1

---

## Context & Scoping Rules

**Base URL:** `https://{university-slug}.api.uniportal.in/api/v1`

**Auth:** Every endpoint requires `Authorization: Bearer <accessToken>`.
The JWT payload carries `{ sub, role: "FACULTY", isHod: false, universityId, facultyId }`.

**Faculty vs HOD:**
- Faculty (`isHod: false`) can only access `/faculty/*` routes.
- HOD (`isHod: true`) uses `/hod/*` routes (see `API.md`).
- Attempting to call a `/faculty/*` route as HOD returns `403 FORBIDDEN`.

**Faculty scoping — what a faculty member can see:**
Faculty data access is scoped by their `FacultyBatchAssignment` rows for the active semester. They can only:
- Mark attendance for batches+subjects they are assigned to.
- Upload notes for subjects they teach.
- See students enrolled in their assigned batches.
- Chat with students they are assigned to as mentor.
- Post announcements to their assigned batches only.

Any attempt to act outside assigned batches/subjects returns `403 NOT_ASSIGNED_TO_BATCH` or `403 NOT_ASSIGNED_TO_SUBJECT`.

**Middleware stack for `/faculty/*`:**
```
requireAuth → requireFaculty (isHod: false) → facultyScope (injects req.assignedBatchIds, req.assignedSubjectIds) → controller
```

`facultyScope` middleware:
```typescript
// Injects into req:
req.assignedBatchIds   // string[] — batches faculty teaches this semester
req.assignedSubjectIds // string[] — subjects faculty teaches this semester
req.mentorStudentIds   // string[] — student IDs faculty mentors this semester
req.semesterId         // active semester ID
```

**Pagination:** All list endpoints accept `?page=1&limit=20`.
**Response envelope:** `{ data, total, page, limit, totalPages }` for lists.
**Errors:** `{ error: { code, message, details?, requestId } }`

---

## Table of Contents

1. [Auth & Session](#1-auth--session)
2. [Faculty Profile & Dashboard](#2-faculty-profile--dashboard)
3. [My Schedule — Timetable & Assignments](#3-my-schedule--timetable--assignments)
4. [Students — View Only](#4-students--view-only)
5. [Attendance — Mark & Track](#5-attendance--mark--track)
6. [Notes — Upload & Manage](#6-notes--upload--manage)
7. [Quiz — Create & Manage](#7-quiz--create--manage)
8. [Announcements](#8-announcements)
9. [Mentorship — Mentee List & Chat](#9-mentorship--mentee-list--chat)
10. [Results — View Only](#10-results--view-only)
11. [Calendar — View & Post](#11-calendar--view--post)
12. [Analytics — Faculty View](#12-analytics--faculty-view)
13. [Faculty Error Codes](#13-faculty-error-codes)

---

## 1. Auth & Session

Faculty uses the same shared auth endpoints as HOD and Student.

### `POST /auth/login`
Standard login — same endpoint as HOD/Student.

**Request Body**
```json
{
  "email": "mehul.rana@lju.edu.in",
  "password": "SecurePass123",
  "role": "FACULTY"
}
```

**Response `200 OK`**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "8f14e45fceea167a5a36...",
  "expiresIn": 900,
  "user": {
    "id": "fac_002",
    "name": "Dr. Mehul Rana",
    "email": "mehul.rana@lju.edu.in",
    "role": "FACULTY",
    "isHod": false,
    "universityId": "univ_lju_01",
    "department": "IT",
    "mentorCode": "SYD"
  }
}
```

---

### `POST /auth/refresh`
**Request Body**
```json
{ "refreshToken": "8f14e45fceea167a5a36..." }
```
**Response `200 OK`**
```json
{ "accessToken": "eyJhbGciOiJIUzI1NiIs...", "expiresIn": 900 }
```

---

### `POST /auth/logout`
**Request Body**
```json
{ "refreshToken": "8f14e45fceea167a5a36..." }
```
**Response `204 No Content`**

---

### `GET /auth/me`
**Response `200 OK`**
```json
{
  "id": "fac_002",
  "employeeId": "EMP002",
  "name": "Dr. Mehul Rana",
  "email": "mehul.rana@lju.edu.in",
  "department": "IT",
  "isHod": false,
  "mentorCode": "SYD",
  "profilePhotoUrl": null,
  "phone": "9876500002",
  "university": { "id": "univ_lju_01", "name": "LJ University", "slug": "lju" }
}
```

---

### `POST /auth/forgot-password`
**Request Body**
```json
{ "email": "mehul.rana@lju.edu.in" }
```
**Response `200 OK`**
```json
{ "message": "If this email exists, a reset link has been sent." }
```

---

## 2. Faculty Profile & Dashboard

### `GET /faculty/dashboard/summary`
Powers the stat cards on the Faculty dashboard.

**Query Params:** `?semesterId=` (defaults to active)

**Response `200 OK`**
```json
{
  "faculty": {
    "id": "fac_002",
    "name": "Dr. Mehul Rana",
    "mentorCode": "SYD",
    "department": "IT"
  },
  "activeSemester": { "id": "sem_3", "label": "Semester 3", "number": 3 },
  "stats": {
    "totalStudents": 147,
    "assignedBatches": 3,
    "assignedSubjects": 2,
    "totalMentees": 28,
    "avgAttendance": { "value": 84.6, "trend": "up", "deltaLabel": "+1.2% this week" },
    "pendingAttendance": 2,
    "unreadMenteeMessages": 5,
    "unreadAnnouncements": 3
  }
}
```

---

### `GET /faculty/profile`
Returns full faculty profile for the Settings / Profile page.

**Response `200 OK`**
```json
{
  "id": "fac_002",
  "employeeId": "EMP002",
  "name": "Dr. Mehul Rana",
  "email": "mehul.rana@lju.edu.in",
  "phone": "9876500002",
  "department": "IT",
  "isHod": false,
  "mentorCode": "SYD",
  "profilePhotoUrl": null,
  "isActive": true,
  "createdAt": "2023-07-01T00:00:00Z"
}
```

---

### `PUT /faculty/profile`
Update own profile (name, phone only — email/department locked).

**Request Body**
```json
{
  "name": "Dr. Mehul A. Rana",
  "phone": "9876500099"
}
```

**Response `200 OK`** — Updated profile object (same shape as GET)

**Errors:** `400 VALIDATION_ERROR` if email or department is included (read-only fields)

---

### `POST /faculty/profile/photo`
Upload profile photo.

**Request:** `multipart/form-data`

| Field | Type | Notes |
|---|---|---|
| `file` | File | JPG / PNG — max 2MB |

**Response `200 OK`**
```json
{ "profilePhotoUrl": "https://s3.ap-south-1.amazonaws.com/.../profiles/fac_002.jpg" }
```

---

### `PATCH /faculty/profile/password`
Change own password.

**Request Body**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass456",
  "confirmPassword": "NewSecurePass456"
}
```

**Response `200 OK`**
```json
{ "message": "Password updated successfully" }
```

**Errors:** `401 CURRENT_PASSWORD_INCORRECT`, `400 PASSWORDS_DO_NOT_MATCH`, `400 PASSWORD_TOO_WEAK`

---

### `GET /faculty/sessions`
Active login sessions for security tab.

**Response `200 OK`**
```json
{
  "data": [
    {
      "id": "sess_1",
      "device": "Chrome on Windows",
      "ip": "103.21.44.xx",
      "location": "Ahmedabad",
      "isCurrent": true,
      "lastActive": "2026-06-30T12:00:00Z"
    },
    {
      "id": "sess_2",
      "device": "Safari on iPhone 14",
      "ip": "103.21.44.xx",
      "isCurrent": false,
      "lastActive": "2026-06-30T10:00:00Z"
    }
  ]
}
```

---

### `DELETE /faculty/sessions/:sessionId`
Revoke a specific session (not current).

**Response `204 No Content`**

**Errors:** `400 CANNOT_REVOKE_CURRENT_SESSION`

---

### `GET /faculty/activity-feed`
Recent activities by this faculty member — attendance marked, notes uploaded, quizzes created.

**Query Params:** `?page=1&limit=10`

**Response `200 OK`**
```json
{
  "data": [
    {
      "id": "act_112",
      "type": "ATTENDANCE_MARKED",
      "title": "Attendance marked",
      "description": "COA lecture for Batch C2 on 30 Jun 2026.",
      "createdAt": "2026-06-30T09:15:00Z"
    },
    {
      "id": "act_111",
      "type": "NOTE_UPLOADED",
      "title": "Note uploaded",
      "description": "\"Pipelining & CPU Design\" uploaded for COA — Batch C2, B1.",
      "createdAt": "2026-06-29T14:30:00Z"
    }
  ],
  "total": 84, "page": 1, "limit": 10, "totalPages": 9
}
```

---

## 3. My Schedule — Timetable & Assignments

### `GET /faculty/my-scope`
Returns what this faculty is assigned to — subjects, batches, semester context.
Used to populate every dropdown in the faculty portal.

**Query Params:** `?semesterId=` (defaults to active)

**Response `200 OK`**
```json
{
  "activeSemester": { "id": "sem_3", "label": "Semester 3", "number": 3, "yearLevel": "SY" },
  "assignments": [
    {
      "id": "fba_551",
      "subject": { "id": "subj_coa", "code": "COA", "name": "Computer Organization & Architecture", "type": "THEORY" },
      "batch": { "id": "batch_c2", "code": "C2", "yearLevel": "SY" },
      "studentCount": 50
    },
    {
      "id": "fba_552",
      "subject": { "id": "subj_coa", "code": "COA", "name": "Computer Organization & Architecture", "type": "THEORY" },
      "batch": { "id": "batch_b1", "code": "B1", "yearLevel": "SY" },
      "studentCount": 48
    },
    {
      "id": "fba_553",
      "subject": { "id": "subj_fsd2", "code": "FSD-2", "name": "Full Stack Development 2", "type": "LAB" },
      "batch": { "id": "batch_c2", "code": "C2", "yearLevel": "SY" },
      "studentCount": 50
    }
  ],
  "uniqueBatches": [
    { "id": "batch_c2", "code": "C2" },
    { "id": "batch_b1", "code": "B1" }
  ],
  "uniqueSubjects": [
    { "id": "subj_coa", "code": "COA" },
    { "id": "subj_fsd2", "code": "FSD-2" }
  ],
  "totalStudents": 147,
  "mentorCode": "SYD"
}
```

---

### `GET /faculty/timetable`
Weekly timetable for the faculty — all their slots across all batches.

**Query Params:** `?semesterId=`

**Response `200 OK`**
```json
{
  "semesterLabel": "Semester 3",
  "slots": [
    {
      "id": "slot_881",
      "dayOfWeek": 1,
      "dayLabel": "Monday",
      "slotStart": "09:00",
      "slotEnd": "10:00",
      "subject": { "code": "COA", "name": "Computer Organization & Architecture" },
      "batch": { "code": "C2" },
      "room": "Hall B"
    },
    {
      "id": "slot_882",
      "dayOfWeek": 1,
      "dayLabel": "Monday",
      "slotStart": "11:00",
      "slotEnd": "12:00",
      "subject": { "code": "COA", "name": "Computer Organization & Architecture" },
      "batch": { "code": "B1" },
      "room": "Hall A"
    },
    {
      "id": "slot_883",
      "dayOfWeek": 3,
      "dayLabel": "Wednesday",
      "slotStart": "14:00",
      "slotEnd": "16:00",
      "subject": { "code": "FSD-2", "name": "Full Stack Development 2" },
      "batch": { "code": "C2" },
      "room": "Lab 3"
    }
  ]
}
```

---

### `GET /faculty/timetable/today`
Today's schedule — filtered to current day. Used for dashboard quick view.

**Response `200 OK`**
```json
{
  "date": "2026-06-30",
  "dayLabel": "Tuesday",
  "slots": [
    {
      "id": "slot_881",
      "slotStart": "09:00",
      "slotEnd": "10:00",
      "subject": { "code": "COA" },
      "batch": { "code": "C2" },
      "attendanceMarked": true
    },
    {
      "id": "slot_884",
      "slotStart": "14:00",
      "slotEnd": "15:00",
      "subject": { "code": "FSD-2" },
      "batch": { "code": "C2" },
      "attendanceMarked": false
    }
  ]
}
```

---

## 4. Students — View Only

Faculty can only **view** students in their assigned batches. They cannot create, edit, or delete student records.

### `GET /faculty/students`
List students across all assigned batches.

**Query Params**

| Param | Type | Description |
|---|---|---|
| `batchId` | uuid | Filter by batch (must be in `req.assignedBatchIds`) |
| `subjectId` | uuid | Filter by subject (must be in `req.assignedSubjectIds`) |
| `search` | string | Match name or enrollmentNo |
| `status` | enum | `ACTIVE \| AT_RISK` |
| `page`, `limit` | int | Pagination |

**Response `200 OK`**
```json
{
  "data": [
    {
      "enrollmentNo": "LJ20IT045",
      "name": "Kavy Thakar",
      "branch": "IT",
      "currentBatch": { "code": "C2" },
      "rollNo": "IT-24-045",
      "attendancePct": 68,
      "status": "AT_RISK"
    }
  ],
  "total": 147, "page": 1, "limit": 20, "totalPages": 8
}
```

**Errors:** `403 NOT_ASSIGNED_TO_BATCH` if `batchId` is not in faculty's scope

---

### `GET /faculty/students/:enrollmentNo`
View a single student profile (read-only).

**Guard:** Student's current batch must be in `req.assignedBatchIds`.

**Response `200 OK`**
```json
{
  "enrollmentNo": "LJ20IT045",
  "name": "Kavy Thakar",
  "branch": "IT",
  "rollNo": "IT-24-045",
  "currentBatch": { "code": "C2" },
  "currentSemester": { "label": "Semester 3" },
  "phone": "9876543210",
  "attendancePct": 68,
  "status": "AT_RISK",
  "isMentee": true
}
```

**Errors:** `403 STUDENT_NOT_IN_ASSIGNED_BATCH`, `404 NOT_FOUND`

---

### `GET /faculty/students/:enrollmentNo/attendance`
Per-subject attendance for a specific student — faculty sees their own subjects only.

**Query Params:** `?semesterId=`

**Response `200 OK`**
```json
{
  "enrollmentNo": "LJ20IT045",
  "name": "Kavy Thakar",
  "subjects": [
    {
      "subjectCode": "COA",
      "totalLectures": 24,
      "attended": 16,
      "percentage": 66.67,
      "isBelowThreshold": true,
      "lectureLog": [
        { "date": "2026-06-02", "isPresent": false },
        { "date": "2026-06-05", "isPresent": true }
      ]
    }
  ]
}
```

---

### `GET /faculty/students/:enrollmentNo/results`
View results for a student — only for subjects faculty teaches.

**Query Params:** `?semesterId=`

**Response `200 OK`**
```json
{
  "enrollmentNo": "LJ20IT045",
  "name": "Kavy Thakar",
  "results": [
    {
      "phase": "T1",
      "subjectCode": "COA",
      "marksObtained": 28,
      "maxMarks": 100,
      "grade": "F",
      "isPublished": true
    },
    {
      "phase": "T2",
      "subjectCode": "COA",
      "marksObtained": 35,
      "maxMarks": 100,
      "grade": "F",
      "isPublished": true
    }
  ]
}
```

---

## 5. Attendance — Mark & Track

### `GET /faculty/attendance/pending`
Returns lectures where attendance has NOT been marked yet.
Used for the dashboard "pending attendance" badge and reminder.

**Response `200 OK`**
```json
{
  "pending": [
    {
      "subjectCode": "FSD-2",
      "batchCode": "C2",
      "lectureDateScheduled": "2026-06-30",
      "slotStart": "14:00",
      "slotEnd": "16:00"
    }
  ],
  "count": 2
}
```

---

### `GET /faculty/attendance/session`
Load a pre-attendance session — returns the student list for a given batch+subject+date.
Called when faculty opens the attendance marking screen.

**Query Params:** `?subjectId=&batchId=&date=` (all required)

**Guard:** Both `subjectId` and `batchId` must be in faculty's assigned scope.

**Response `200 OK`**
```json
{
  "subjectCode": "COA",
  "subjectName": "Computer Organization & Architecture",
  "batchCode": "C2",
  "date": "2026-06-30",
  "existingRecord": false,
  "students": [
    {
      "enrollmentId": "enr_4521",
      "enrollmentNo": "LJ20IT045",
      "name": "Kavy Thakar",
      "rollNo": "IT-24-045",
      "isPresent": null,
      "attendancePctSoFar": 66.67
    },
    {
      "enrollmentId": "enr_4522",
      "enrollmentNo": "LJ21IT112",
      "name": "Het Patel",
      "rollNo": "IT-24-112",
      "isPresent": null,
      "attendancePctSoFar": 70.0
    }
  ]
}
```

If attendance was already marked for this date, `existingRecord: true` and each student's `isPresent` is populated with the previously recorded value.

---

### `POST /faculty/attendance`
Submit attendance for a lecture. Idempotent — re-submitting the same `(enrollmentId, subjectId, lectureDate)` overwrites.

**Guard:** `subjectId` + `batchId` must be in `req.assignedSubjectIds` / `req.assignedBatchIds`.

**Request Body**
```json
{
  "subjectId": "subj_coa",
  "batchId": "batch_c2",
  "lectureDate": "2026-06-30",
  "attendance": [
    { "enrollmentId": "enr_4521", "isPresent": false },
    { "enrollmentId": "enr_4522", "isPresent": true },
    { "enrollmentId": "enr_4523", "isPresent": true }
  ]
}
```

**Response `201 Created`**
```json
{
  "recordsCreated": 3,
  "subjectCode": "COA",
  "batchCode": "C2",
  "lectureDate": "2026-06-30",
  "presentCount": 2,
  "absentCount": 1
}
```

**Errors:**
| Code | Cause |
|---|---|
| `403 NOT_ASSIGNED_TO_BATCH` | batchId not in faculty scope |
| `403 NOT_ASSIGNED_TO_SUBJECT` | subjectId not in faculty scope |
| `403 ATTENDANCE_RECORD_LOCKED` | HOD has locked records for this batch+subject |
| `400 FUTURE_DATE` | lectureDate is in the future |
| `400 INVALID_ENROLLMENT` | one or more enrollmentIds not in this batch |

---

### `PATCH /faculty/attendance`
Edit a previously submitted attendance record (correct a mistake).
Blocked if HOD has locked the records.

**Request Body**
```json
{
  "subjectId": "subj_coa",
  "batchId": "batch_c2",
  "lectureDate": "2026-06-30",
  "corrections": [
    { "enrollmentId": "enr_4521", "isPresent": true, "remarks": "Was present, marked wrongly" }
  ]
}
```

**Response `200 OK`**
```json
{
  "corrected": 1,
  "lectureDate": "2026-06-30",
  "subjectCode": "COA"
}
```

**Errors:** `403 ATTENDANCE_RECORD_LOCKED`, `404 ATTENDANCE_NOT_YET_MARKED`

---

### `DELETE /faculty/attendance`
Delete all attendance records for a specific lecture date (entire lecture re-do).
Blocked if locked.

**Query Params:** `?subjectId=&batchId=&date=`

**Response `200 OK`**
```json
{ "deletedCount": 50, "lectureDate": "2026-06-30" }
```

**Errors:** `403 ATTENDANCE_RECORD_LOCKED`

---

### `GET /faculty/attendance/summary`
Attendance summary across all assigned batches and subjects.
Powers the Analytics → My Classes tab.

**Query Params:** `?semesterId=`

**Response `200 OK`**
```json
{
  "semesterLabel": "Semester 3",
  "bySubjectAndBatch": [
    {
      "subjectCode": "COA",
      "batchCode": "C2",
      "totalStudents": 50,
      "avgAttendancePct": 84.2,
      "belowThresholdCount": 8,
      "totalLecturesMarked": 24
    },
    {
      "subjectCode": "COA",
      "batchCode": "B1",
      "totalStudents": 48,
      "avgAttendancePct": 88.1,
      "belowThresholdCount": 3,
      "totalLecturesMarked": 24
    }
  ]
}
```

---

### `GET /faculty/attendance/lecture-log`
List of all lectures marked by this faculty for a subject+batch.

**Query Params:** `?subjectId=&batchId=&semesterId=`

**Response `200 OK`**
```json
{
  "subjectCode": "COA",
  "batchCode": "C2",
  "lectures": [
    { "date": "2026-06-02", "presentCount": 48, "absentCount": 2, "isLocked": true },
    { "date": "2026-06-05", "presentCount": 45, "absentCount": 5, "isLocked": true },
    { "date": "2026-06-30", "presentCount": 49, "absentCount": 1, "isLocked": false }
  ],
  "totalLectures": 24
}
```

---

### `GET /faculty/attendance/students-below-threshold`
List students in faculty's batches below the attendance threshold.
Used for "At Risk" highlight in Analytics.

**Query Params:** `?semesterId=&subjectId=`

**Response `200 OK`**
```json
{
  "threshold": 75,
  "data": [
    {
      "enrollmentNo": "LJ20IT045",
      "name": "Kavy Thakar",
      "batchCode": "C2",
      "subjectCode": "COA",
      "attendancePct": 66.67,
      "isMentee": true
    }
  ],
  "total": 8
}
```

---

## 6. Notes — Upload & Manage

### `GET /faculty/notes`
List all notes uploaded by this faculty, filterable by subject.

**Query Params:** `?subjectId=&batchId=&page=1&limit=20`

**Response `200 OK`**
```json
{
  "data": [
    {
      "id": "note_221",
      "subjectCode": "COA",
      "title": "Pipelining & CPU Design",
      "description": "Covers 5-stage pipeline, hazards, and solutions.",
      "fileUrl": "https://s3.../notes/note_221.pdf",
      "mimeType": "application/pdf",
      "fileSizeKb": 1240,
      "aiSummary": "This note covers the 5-stage instruction pipeline...",
      "hasFlashcards": true,
      "createdAt": "2026-06-29T14:30:00Z"
    }
  ],
  "total": 12, "page": 1, "limit": 20, "totalPages": 1
}
```

---

### `GET /faculty/notes/:noteId`
Single note detail including flashcards.

**Guard:** Note must belong to this faculty.

**Response `200 OK`**
```json
{
  "id": "note_221",
  "subjectCode": "COA",
  "title": "Pipelining & CPU Design",
  "description": "Covers 5-stage pipeline, hazards, and solutions.",
  "fileUrl": "https://s3.../notes/note_221.pdf",
  "mimeType": "application/pdf",
  "fileSizeKb": 1240,
  "aiSummary": "This note covers the 5-stage instruction pipeline including IF, ID, EX, MEM, WB stages...",
  "flashcards": [
    { "id": "fc_1", "question": "What is a pipeline hazard?", "answer": "A situation that prevents the next instruction from executing in the next clock cycle.", "order": 1 },
    { "id": "fc_2", "question": "Name the three types of pipeline hazards.", "answer": "Structural, Data, and Control hazards.", "order": 2 }
  ],
  "createdAt": "2026-06-29T14:30:00Z"
}
```

---

### `POST /faculty/notes`
Upload a new note (PDF or other file).

**Request:** `multipart/form-data`

| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | File | Yes | PDF, DOCX, PPT, MP4 — max 50MB |
| `subjectId` | string | Yes | Must be in `req.assignedSubjectIds` |
| `title` | string | Yes | |
| `description` | string | No | |
| `visibleToBatchIds` | string (comma-sep) | No | Defaults to all batches faculty teaches for this subject |

**Guard:** `subjectId` must be in `req.assignedSubjectIds`.

**Response `201 Created`**
```json
{
  "id": "note_222",
  "title": "Cache Memory & Locality",
  "fileUrl": "https://s3.../notes/note_222.pdf",
  "aiJobId": "job_ai_441",
  "aiStatus": "queued",
  "message": "Note uploaded. AI summary will be available in ~30 seconds."
}
```

**Errors:**
| Code | Cause |
|---|---|
| `403 NOT_ASSIGNED_TO_SUBJECT` | subjectId not in faculty scope |
| `400 FILE_TOO_LARGE` | file exceeds 50MB |
| `400 UNSUPPORTED_FILE_TYPE` | file type not allowed |

---

### `PUT /faculty/notes/:noteId`
Edit note metadata (title, description) — does not re-upload the file.

**Guard:** Note must belong to this faculty.

**Request Body**
```json
{
  "title": "Cache Memory, Locality & Associativity",
  "description": "Updated with direct-mapped cache examples."
}
```

**Response `200 OK`** — Updated note object (same shape as GET single, without flashcards)

---

### `DELETE /faculty/notes/:noteId`
Soft-delete note. Also queues S3 file deletion. Students lose access immediately.

**Guard:** Note must belong to this faculty.

**Response `204 No Content`**

---

### `GET /faculty/notes/:noteId/ai-status`
Poll the AI processing status (summary generation + flashcard creation).

**Response `200 OK`**
```json
{
  "noteId": "note_222",
  "jobId": "job_ai_441",
  "status": "COMPLETE",
  "aiSummary": "This note explains cache memory hierarchy...",
  "flashcardCount": 8
}
```

`status` is one of `QUEUED | PROCESSING | COMPLETE | FAILED`.

---

### `POST /faculty/notes/:noteId/flashcards`
Manually add a flashcard to a note (in addition to AI-generated ones).

**Request Body**
```json
{
  "question": "What is the principle of temporal locality?",
  "answer": "If a memory location is accessed, it is likely to be accessed again soon."
}
```

**Response `201 Created`**
```json
{ "id": "fc_12", "question": "...", "answer": "...", "order": 9 }
```

---

### `DELETE /faculty/notes/:noteId/flashcards/:flashcardId`
Delete a specific flashcard.

**Response `204 No Content`**

---

## 7. Quiz — Create & Manage

### `GET /faculty/quizzes`
List all quizzes created by this faculty.

**Query Params:** `?subjectId=&semesterId=&isPublished=&page=1&limit=20`

**Response `200 OK`**
```json
{
  "data": [
    {
      "id": "quiz_331",
      "title": "T2 Practice — Pipeline & Cache",
      "subjectCode": "COA",
      "isAiGenerated": true,
      "isPublished": true,
      "questionCount": 10,
      "attemptCount": 44,
      "avgScore": 72.4,
      "dueDate": "2026-07-10T23:59:00Z",
      "createdAt": "2026-06-28T10:00:00Z"
    }
  ],
  "total": 4, "page": 1, "limit": 20, "totalPages": 1
}
```

---

### `GET /faculty/quizzes/:quizId`
Full quiz detail including questions.

**Guard:** Quiz must belong to this faculty.

**Response `200 OK`**
```json
{
  "id": "quiz_331",
  "title": "T2 Practice — Pipeline & Cache",
  "description": "10 MCQs covering T2 syllabus for COA.",
  "subjectCode": "COA",
  "semesterLabel": "Semester 3",
  "isAiGenerated": true,
  "isPublished": true,
  "timeLimitMins": 20,
  "dueDate": "2026-07-10T23:59:00Z",
  "questions": [
    {
      "id": "qst_1",
      "text": "Which stage of the pipeline executes the ALU operations?",
      "options": [
        { "id": "A", "text": "IF" },
        { "id": "B", "text": "ID" },
        { "id": "C", "text": "EX" },
        { "id": "D", "text": "WB" }
      ],
      "correctOption": "C",
      "explanation": "The Execute (EX) stage performs arithmetic and logic operations using the ALU.",
      "order": 1
    }
  ],
  "stats": { "attemptCount": 44, "avgScore": 72.4, "highScore": 100, "lowScore": 30 }
}
```

---

### `POST /faculty/quizzes`
Create a new quiz manually.

**Request Body**
```json
{
  "subjectId": "subj_coa",
  "semesterId": "sem_3",
  "title": "T2 Practice — Pipeline & Cache",
  "description": "10 MCQs covering T2 syllabus for COA.",
  "timeLimitMins": 20,
  "dueDate": "2026-07-10T23:59:00Z",
  "questions": [
    {
      "text": "Which stage of the pipeline executes the ALU operations?",
      "options": [
        { "id": "A", "text": "IF" },
        { "id": "B", "text": "ID" },
        { "id": "C", "text": "EX" },
        { "id": "D", "text": "WB" }
      ],
      "correctOption": "C",
      "explanation": "The Execute (EX) stage performs arithmetic and logic operations.",
      "order": 1
    }
  ]
}
```

**Guard:** `subjectId` must be in `req.assignedSubjectIds`.

**Response `201 Created`**
```json
{
  "id": "quiz_332",
  "title": "T2 Practice — Pipeline & Cache",
  "isPublished": false,
  "questionCount": 1,
  "message": "Quiz created as draft. Publish when ready."
}
```

---

### `POST /faculty/quizzes/ai-generate`
Ask Django AI service to generate quiz questions. Returns a draft quiz for faculty to review and edit before publishing.

**Request Body**
```json
{
  "subjectId": "subj_coa",
  "semesterId": "sem_3",
  "topic": "Pipelining and Cache Memory",
  "questionCount": 10,
  "difficulty": "MEDIUM"
}
```

`difficulty` is one of `EASY | MEDIUM | HARD`.

**Guard:** `subjectId` must be in `req.assignedSubjectIds`.

**Response `202 Accepted`**
```json
{
  "jobId": "ai_quiz_job_881",
  "status": "QUEUED",
  "message": "AI is generating 10 questions. Poll /faculty/quizzes/ai-status/ai_quiz_job_881"
}
```

---

### `GET /faculty/quizzes/ai-status/:jobId`
Poll AI quiz generation job status.

**Response `200 OK`**
```json
{
  "jobId": "ai_quiz_job_881",
  "status": "COMPLETE",
  "draftQuizId": "quiz_333",
  "questionCount": 10,
  "message": "Review and edit the draft quiz, then publish."
}
```

`status` is `QUEUED | PROCESSING | COMPLETE | FAILED`.

---

### `PUT /faculty/quizzes/:quizId`
Update quiz metadata and questions (only before publishing — or after if corrections needed).

**Guard:** Quiz must belong to this faculty.

**Request Body**
```json
{
  "title": "T2 Practice — Updated",
  "timeLimitMins": 25,
  "dueDate": "2026-07-12T23:59:00Z"
}
```

**Response `200 OK`** — Updated quiz object (without questions)

---

### `PUT /faculty/quizzes/:quizId/questions`
Full replace of all questions in a quiz (used when editing AI-generated draft).

**Request Body**
```json
{
  "questions": [
    {
      "text": "What is a data hazard?",
      "options": [{ "id": "A", "text": "..." }, { "id": "B", "text": "..." }, { "id": "C", "text": "..." }, { "id": "D", "text": "..." }],
      "correctOption": "A",
      "explanation": "...",
      "order": 1
    }
  ]
}
```

**Response `200 OK`**
```json
{ "quizId": "quiz_333", "questionCount": 10 }
```

---

### `PATCH /faculty/quizzes/:quizId/publish`
Publish a draft quiz — makes it visible to students.

**Guard:** Quiz must belong to this faculty. Must have at least 1 question.

**Response `200 OK`**
```json
{ "quizId": "quiz_333", "isPublished": true, "publishedAt": "2026-06-30T11:00:00Z" }
```

**Errors:** `400 QUIZ_HAS_NO_QUESTIONS`, `409 QUIZ_ALREADY_PUBLISHED`

---

### `PATCH /faculty/quizzes/:quizId/unpublish`
Unpublish a quiz (hides from students — existing attempts are preserved).

**Response `200 OK`**
```json
{ "quizId": "quiz_333", "isPublished": false }
```

---

### `DELETE /faculty/quizzes/:quizId`
Soft-delete a quiz. Blocked if students have already attempted it.

**Response `204 No Content`**

**Errors:** `409 QUIZ_HAS_ATTEMPTS`

---

### `GET /faculty/quizzes/:quizId/attempts`
View all student attempts for a quiz with scores.

**Query Params:** `?batchId=&page=1&limit=20`

**Guard:** Quiz must belong to this faculty.

**Response `200 OK`**
```json
{
  "data": [
    {
      "studentName": "Kavy Thakar",
      "enrollmentNo": "LJ20IT045",
      "batchCode": "C2",
      "score": 40.0,
      "submittedAt": "2026-07-05T10:22:00Z"
    }
  ],
  "stats": { "avgScore": 72.4, "highScore": 100, "lowScore": 30, "attemptCount": 44 },
  "total": 44, "page": 1, "limit": 20, "totalPages": 3
}
```

---

### `GET /faculty/quizzes/:quizId/attempts/:attemptId`
View a single student's attempt — which options they chose and which were correct.

**Response `200 OK`**
```json
{
  "studentName": "Kavy Thakar",
  "enrollmentNo": "LJ20IT045",
  "score": 40.0,
  "submittedAt": "2026-07-05T10:22:00Z",
  "questions": [
    {
      "questionText": "Which stage of the pipeline executes ALU operations?",
      "selectedOption": "A",
      "correctOption": "C",
      "isCorrect": false,
      "explanation": "The Execute (EX) stage performs arithmetic..."
    }
  ]
}
```

---

## 8. Announcements

### `GET /faculty/announcements`
List announcements visible to this faculty — includes all HOD announcements + own announcements.

**Query Params:** `?page=1&limit=20`

**Response `200 OK`**
```json
{
  "data": [
    {
      "id": "ann_771",
      "title": "Semester 3 Schedule Update",
      "body": "Please note the revised timetable from July 4th.",
      "scope": "ALL",
      "scopeValue": null,
      "senderName": "Dr. Rajesh Patel",
      "senderRole": "HOD",
      "createdAt": "2026-06-29T09:00:00Z",
      "isOwn": false
    },
    {
      "id": "ann_772",
      "title": "COA Assignment Reminder",
      "body": "Submit your pipeline design assignment by Friday.",
      "scope": "BATCH",
      "scopeValue": "batch_c2",
      "scopeLabel": "Batch C2",
      "senderName": "Dr. Mehul Rana",
      "senderRole": "FACULTY",
      "createdAt": "2026-06-28T11:00:00Z",
      "isOwn": true
    }
  ],
  "total": 18, "page": 1, "limit": 20, "totalPages": 1
}
```

---

### `POST /faculty/announcements`
Post an announcement to faculty's assigned batches.

**Request Body**
```json
{
  "title": "COA Assignment Reminder",
  "body": "Submit your pipeline design assignment by Friday 4th July 2026.",
  "scope": "BATCH",
  "scopeValue": "batch_c2"
}
```

`scope` options for faculty (more restricted than HOD):
- `BATCH` — one specific batch (must be in `req.assignedBatchIds`)
- `ALL_MY_BATCHES` — broadcast to all batches this faculty teaches

Faculty **cannot** post with scope `ALL` (university-wide) or `YEAR_LEVEL` — those are HOD only.

**Guard:** If `scope = BATCH`, `scopeValue` (batchId) must be in `req.assignedBatchIds`.

**Response `201 Created`**
```json
{
  "id": "ann_773",
  "title": "COA Assignment Reminder",
  "scope": "BATCH",
  "scopeLabel": "Batch C2",
  "createdAt": "2026-06-30T10:00:00Z"
}
```

**Errors:** `403 BATCH_NOT_ASSIGNED`, `403 SCOPE_NOT_ALLOWED` (if faculty tries ALL or YEAR_LEVEL)

---

### `PUT /faculty/announcements/:announcementId`
Edit own announcement.

**Guard:** Announcement must belong to this faculty.

**Request Body**
```json
{
  "title": "COA Assignment Reminder — Updated",
  "body": "Deadline extended to Monday 7th July 2026."
}
```

**Response `200 OK`** — Updated announcement object

---

### `DELETE /faculty/announcements/:announcementId`
Delete own announcement (soft-delete).

**Guard:** Announcement must belong to this faculty.

**Response `204 No Content`**

---

## 9. Mentorship — Mentee List & Chat

Faculty can only see/chat with students they are assigned to as mentor via `MentorAssignment`.

### `GET /faculty/mentees`
List all students this faculty mentors for the active semester.

**Query Params:** `?semesterId=&search=&page=1&limit=20`

**Response `200 OK`**
```json
{
  "mentorCode": "SYD",
  "semesterLabel": "Semester 3",
  "data": [
    {
      "mentorAssignmentId": "ma_8821",
      "enrollmentNo": "LJ20IT045",
      "name": "Kavy Thakar",
      "branch": "IT",
      "batchCode": "C2",
      "rollNo": "IT-24-045",
      "attendancePct": 68,
      "latestMarksPct": 35,
      "status": "AT_RISK",
      "unreadMessages": 2,
      "lastMessageAt": "2026-06-30T09:41:00Z"
    },
    {
      "mentorAssignmentId": "ma_8822",
      "enrollmentNo": "LJ21IT112",
      "name": "Het Patel",
      "branch": "IT",
      "batchCode": "C2",
      "rollNo": "IT-24-112",
      "attendancePct": 70,
      "latestMarksPct": 38,
      "status": "AT_RISK",
      "unreadMessages": 0,
      "lastMessageAt": "2026-06-28T14:00:00Z"
    }
  ],
  "total": 28, "page": 1, "limit": 20, "totalPages": 2
}
```

---

### `GET /faculty/mentees/:enrollmentNo/profile`
Full profile of a specific mentee.

**Guard:** Student must be a mentee of this faculty this semester.

**Response `200 OK`**
```json
{
  "mentorAssignmentId": "ma_8821",
  "enrollmentNo": "LJ20IT045",
  "name": "Kavy Thakar",
  "branch": "IT",
  "batchCode": "C2",
  "rollNo": "IT-24-045",
  "phone": "9876543210",
  "admissionYear": 2023,
  "attendanceSummary": [
    { "subjectCode": "COA", "pct": 66.67 },
    { "subjectCode": "DM", "pct": 72.0 }
  ],
  "resultsSummary": [
    { "phase": "T1", "subjectCode": "COA", "marks": 28, "grade": "F" },
    { "phase": "T2", "subjectCode": "COA", "marks": 35, "grade": "F" }
  ],
  "riskFlag": "BOTH",
  "academicHistory": [
    { "semesterLabel": "Semester 1", "yearLevel": "FY", "batchCode": "B3", "rollNo": "IT-23-012" },
    { "semesterLabel": "Semester 2", "yearLevel": "FY", "batchCode": "B1", "rollNo": "IT-23-045" },
    { "semesterLabel": "Semester 3", "yearLevel": "SY", "batchCode": "C2", "rollNo": "IT-24-045" }
  ]
}
```

---

### `GET /faculty/mentees/unread-counts`
Returns unread message count per mentee. Used for sidebar badge and mentee list dots.

**Response `200 OK`**
```json
{
  "totalUnread": 7,
  "perMentee": [
    { "mentorAssignmentId": "ma_8821", "studentName": "Kavy Thakar", "unreadCount": 2 },
    { "mentorAssignmentId": "ma_8825", "studentName": "Aneri Dave", "unreadCount": 5 }
  ]
}
```

---

### `GET /faculty/mentees/at-risk`
Mentees below attendance or marks threshold. Powers the "My Mentees" analytics tab.

**Query Params:** `?semesterId=`

**Response `200 OK`**
```json
{
  "data": [
    {
      "enrollmentNo": "LJ20IT045",
      "name": "Kavy Thakar",
      "batchCode": "C2",
      "attendancePct": 68,
      "latestMarksPct": 35,
      "riskFactor": "BOTH"
    }
  ],
  "total": 5
}
```

---

### `GET /faculty/chat/:mentorAssignmentId/messages`
Paginated message history for a mentor-student chat room.
Newest messages last (ascending `sentAt`).

**Guard:** `mentorAssignmentId` must belong to this faculty.

**Query Params:** `?page=1&limit=30`

**Response `200 OK`**
```json
{
  "mentorAssignmentId": "ma_8821",
  "student": { "name": "Kavy Thakar", "enrollmentNo": "LJ20IT045" },
  "data": [
    {
      "id": "msg_441",
      "senderRole": "STUDENT",
      "senderName": "Kavy Thakar",
      "content": "Sir, I need help with pipeline hazards.",
      "isRead": true,
      "sentAt": "2026-06-30T09:30:00Z"
    },
    {
      "id": "msg_442",
      "senderRole": "FACULTY",
      "senderName": "Dr. Mehul Rana",
      "content": "Sure Kavy, let's discuss during office hours tomorrow at 2 PM.",
      "isRead": true,
      "sentAt": "2026-06-30T09:41:00Z"
    },
    {
      "id": "msg_443",
      "senderRole": "STUDENT",
      "senderName": "Kavy Thakar",
      "content": "Thank you sir!",
      "isRead": false,
      "sentAt": "2026-06-30T09:43:00Z"
    }
  ],
  "total": 18, "page": 1, "limit": 30, "totalPages": 1
}
```

---

### `POST /faculty/chat/:mentorAssignmentId/messages`
Send a message to a mentee. Also emitted via Socket.io on the server side.

**Guard:** `mentorAssignmentId` must belong to this faculty.

**Request Body**
```json
{ "content": "Please come to my office tomorrow at 2 PM." }
```

**Response `201 Created`**
```json
{
  "id": "msg_444",
  "senderRole": "FACULTY",
  "content": "Please come to my office tomorrow at 2 PM.",
  "sentAt": "2026-06-30T11:00:00Z"
}
```

**Errors:** `403 NOT_MENTOR_OF_STUDENT`, `400 EMPTY_MESSAGE`

---

### `PATCH /faculty/chat/:mentorAssignmentId/mark-read`
Mark all unread messages from the student as read (called when faculty opens the chat window).

**Response `200 OK`**
```json
{ "markedRead": 3 }
```

---

### Socket.io Events (Faculty Client)

The faculty client connects to Socket.io on login.

**Client → Server:**

| Event | Payload | Description |
|---|---|---|
| `join_room` | `{ mentorAssignmentId }` | Join chat room for a mentee |
| `leave_room` | `{ mentorAssignmentId }` | Leave a chat room |
| `send_message` | `{ mentorAssignmentId, content }` | Send a chat message |
| `typing_start` | `{ mentorAssignmentId }` | Broadcast typing indicator |
| `typing_stop` | `{ mentorAssignmentId }` | Stop typing indicator |
| `ping` | — | Heartbeat every 30s to keep presence alive |

**Server → Client:**

| Event | Payload | Description |
|---|---|---|
| `new_message` | `{ id, senderRole, senderName, content, sentAt, mentorAssignmentId }` | Incoming message from any room faculty is in |
| `student_online` | `{ studentId, mentorAssignmentId }` | Mentee came online |
| `student_offline` | `{ studentId, mentorAssignmentId }` | Mentee went offline |
| `student_typing` | `{ mentorAssignmentId }` | Mentee is typing |
| `student_stopped_typing` | `{ mentorAssignmentId }` | Mentee stopped typing |
| `unread_update` | `{ mentorAssignmentId, unreadCount }` | Unread count changed |

---

## 10. Results — View Only

Faculty can only **view** results for the subjects they teach. They cannot upload or publish results — that is HOD only.

### `GET /faculty/results/summary`
Phase-completion summary for faculty's subjects — how many results are uploaded vs pending.

**Query Params:** `?semesterId=`

**Response `200 OK`**
```json
{
  "semesterLabel": "Semester 3",
  "bySubject": [
    {
      "subjectCode": "COA",
      "phases": [
        { "phase": "T1", "isPublished": true, "avgMarksPct": 68.2 },
        { "phase": "T2", "isPublished": true, "avgMarksPct": 72.0 },
        { "phase": "T3", "isPublished": false, "avgMarksPct": null },
        { "phase": "T4", "isPublished": false, "avgMarksPct": null }
      ]
    }
  ]
}
```

---

### `GET /faculty/results`
List results for faculty's subjects across their batches.

**Query Params:** `?subjectId=&batchId=&phaseId=&page=1&limit=50`

**Guard:** `subjectId` and `batchId` must be in faculty's scope.

**Response `200 OK`**
```json
{
  "data": [
    {
      "enrollmentNo": "LJ20IT045",
      "studentName": "Kavy Thakar",
      "batchCode": "C2",
      "subjectCode": "COA",
      "phase": "T2",
      "marksObtained": 35,
      "maxMarks": 100,
      "grade": "F",
      "isPublished": true
    }
  ],
  "stats": { "avgMarksPct": 72.0, "passCount": 46, "failCount": 4 },
  "total": 50, "page": 1, "limit": 50, "totalPages": 1
}
```

---

### `GET /faculty/results/leaderboard`
Top students in faculty's subjects for a phase.

**Query Params:** `?subjectId=&phaseId=&batchId=&limit=10`

**Response `200 OK`**
```json
{
  "phase": "T2",
  "subjectCode": "COA",
  "batchCode": "C2",
  "data": [
    { "rank": 1, "enrollmentNo": "LJ21AIML009", "name": "Sena Raval", "marksObtained": 96, "grade": "A+" },
    { "rank": 2, "enrollmentNo": "LJ20CE001", "name": "Aneri Dave", "marksObtained": 91, "grade": "A+" }
  ]
}
```

---

## 11. Calendar — View & Post

### `GET /faculty/calendar/events`
All calendar events visible to faculty for a given month.

**Query Params:** `?year=2026&month=7`

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

### `GET /faculty/calendar/events/upcoming`
Upcoming events in the next 30 days.

**Query Params:** `?limit=6`

**Response `200 OK`**
```json
{
  "data": [
    { "id": "evt_201", "date": "2026-07-04", "title": "T3 Phase Start", "type": "PHASE", "daysAway": 4 }
  ]
}
```

---

### `GET /faculty/calendar/phase-timeline`
Phase timeline for the active semester — used in faculty dashboard sidebar.

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

## 12. Analytics — Faculty View

### `GET /faculty/analytics/attendance`
Full attendance analytics for faculty's assigned subjects and batches.

**Query Params:** `?semesterId=&subjectId=&batchId=`

**Response `200 OK`**
```json
{
  "overview": {
    "avgAttendancePct": 84.6,
    "belowThresholdCount": 11,
    "totalLecturesDelivered": 48
  },
  "bySubjectBatch": [
    {
      "subjectCode": "COA",
      "batchCode": "C2",
      "avgPct": 84.2,
      "belowThresholdCount": 8,
      "students": [
        { "enrollmentNo": "LJ20IT045", "name": "Kavy Thakar", "pct": 66.67, "isAtRisk": true }
      ]
    }
  ],
  "trend": {
    "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
    "data": [82.0, 84.5, 83.1, 86.2]
  }
}
```

---

### `GET /faculty/analytics/marks`
Marks analytics for faculty's subjects.

**Query Params:** `?semesterId=&subjectId=&phaseId=`

**Response `200 OK`**
```json
{
  "subjectCode": "COA",
  "phase": "T2",
  "stats": {
    "avgMarksPct": 72.0,
    "passRate": 92.0,
    "highestMarks": 96,
    "lowestMarks": 28
  },
  "gradeDistribution": [
    { "grade": "A+ (≥90)", "count": 5 },
    { "grade": "A (80–89)", "count": 12 },
    { "grade": "B (70–79)", "count": 18 },
    { "grade": "C (60–69)", "count": 9 },
    { "grade": "D (50–59)", "count": 4 },
    { "grade": "F (<50)", "count": 2 }
  ],
  "phaseComparison": [
    { "phase": "T1", "avgPct": 68.2 },
    { "phase": "T2", "avgPct": 72.0 }
  ]
}
```

---

### `GET /faculty/analytics/mentees`
Combined attendance + marks performance for all mentees.
Powers the "My Mentees" analytics tab.

**Query Params:** `?semesterId=`

**Response `200 OK`**
```json
{
  "semesterLabel": "Semester 3",
  "totalMentees": 28,
  "atRiskCount": 5,
  "data": [
    {
      "enrollmentNo": "LJ20IT045",
      "name": "Kavy Thakar",
      "batchCode": "C2",
      "avgAttendancePct": 68,
      "avgMarksPct": 35,
      "riskFactor": "BOTH",
      "subjectBreakdown": [
        { "subjectCode": "COA", "attendancePct": 66.67, "t2Marks": 35 },
        { "subjectCode": "DM", "attendancePct": 72.0, "t2Marks": 41 }
      ]
    }
  ]
}
```

---

### `GET /faculty/analytics/quiz-performance`
Quiz analytics per quiz — completion rate, avg score, question-level wrong-answer rates.

**Query Params:** `?quizId=`

**Response `200 OK`**
```json
{
  "quizId": "quiz_331",
  "title": "T2 Practice — Pipeline & Cache",
  "publishedAt": "2026-06-28T10:00:00Z",
  "totalEligibleStudents": 50,
  "attemptCount": 44,
  "completionRate": 88.0,
  "avgScore": 72.4,
  "questionAnalysis": [
    {
      "questionId": "qst_1",
      "questionText": "Which stage executes ALU operations?",
      "correctRate": 91.0,
      "wrongOptionFrequency": [
        { "optionId": "A", "count": 2 },
        { "optionId": "B", "count": 2 },
        { "optionId": "D", "count": 0 }
      ]
    }
  ]
}
```

---

## 13. Faculty Error Codes

| HTTP Status | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request body failed schema validation |
| 400 | `FUTURE_DATE` | Attendance date is in the future |
| 400 | `EMPTY_MESSAGE` | Chat message content is blank |
| 400 | `QUIZ_HAS_NO_QUESTIONS` | Cannot publish a quiz with 0 questions |
| 400 | `FILE_TOO_LARGE` | Uploaded file exceeds size limit |
| 400 | `UNSUPPORTED_FILE_TYPE` | File extension not allowed |
| 400 | `PASSWORDS_DO_NOT_MATCH` | Password confirmation mismatch |
| 400 | `PASSWORD_TOO_WEAK` | New password does not meet strength requirements |
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 401 | `TOKEN_EXPIRED` | Access token expired — call `/auth/refresh` |
| 401 | `CURRENT_PASSWORD_INCORRECT` | Wrong current password on change |
| 403 | `FORBIDDEN` | Route is HOD-only — faculty cannot access it |
| 403 | `NOT_ASSIGNED_TO_BATCH` | batchId not in this faculty's FacultyBatchAssignment |
| 403 | `NOT_ASSIGNED_TO_SUBJECT` | subjectId not in this faculty's FacultyBatchAssignment |
| 403 | `STUDENT_NOT_IN_ASSIGNED_BATCH` | Student's batch is not in faculty scope |
| 403 | `NOT_MENTOR_OF_STUDENT` | mentorAssignmentId does not belong to this faculty |
| 403 | `ATTENDANCE_RECORD_LOCKED` | HOD has locked attendance — cannot edit |
| 403 | `SCOPE_NOT_ALLOWED` | Faculty tried to post announcement with HOD-only scope |
| 403 | `BATCH_NOT_ASSIGNED` | Announcement batch not in faculty's assigned batches |
| 403 | `CANNOT_REVOKE_CURRENT_SESSION` | Tried to revoke the currently active session |
| 404 | `NOT_FOUND` | Resource doesn't exist or was soft-deleted |
| 404 | `ATTENDANCE_NOT_YET_MARKED` | Tried to correct a lecture with no existing record |
| 409 | `QUIZ_ALREADY_PUBLISHED` | Cannot publish an already-published quiz |
| 409 | `QUIZ_HAS_ATTEMPTS` | Cannot delete a quiz that students have attempted |
```

**Standard error response:**
```json
{
  "error": {
    "code": "NOT_ASSIGNED_TO_BATCH",
    "message": "You are not assigned to teach any subject in batch D1 this semester.",
    "requestId": "req_a1b2c3d4"
  }
}
```
