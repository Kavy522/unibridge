# UniPortal — Student API Reference
> Express backend · All endpoints needed by the Student portal · v1

---

## Context & Scoping Rules

**Base URL:** `https://{university-slug}.api.uniportal.in/api/v1`

**Auth:** Every endpoint requires `Authorization: Bearer <accessToken>`.
JWT payload: `{ sub, role: "STUDENT", universityId, studentId, enrollmentNo }`.

**Student scoping — the golden rules:**
1. A student can only see **their own data** — results, attendance, notes, quiz attempts, chat messages, self-notes, AI conversations.
2. Notes and quizzes are visible if the subject belongs to the student's **current batch enrollment**.
3. Announcements are visible if `scope = ALL`, or `scope = BATCH` and `scopeValue` matches student's batch, or `scope = YEAR_LEVEL` and `scopeValue` matches student's year level.
4. Chat is only with the student's **assigned mentor** for the active semester. One mentor per semester.
5. Results are only visible **after HOD publishes them** (`isPublished = true`).
6. Students are **read-only** on all HOD/Faculty-managed data — they cannot create, edit, or delete results, attendance records, faculty notes, subjects, or batches.

**Middleware stack for `/student/*`:**
```
requireAuth → requireStudent (role = STUDENT) → studentScope (injects req.student, req.currentEnrollment) → controller
```

`studentScope` injects into `req`:
```typescript
req.student           // full Student row
req.currentEnrollment // active StudentEnrollment row { id, batchId, semesterId, rollNo, yearLevel }
req.batchId           // shorthand
req.semesterId        // shorthand
```

**Pagination:** All list endpoints accept `?page=1&limit=20`.
**Response envelope:** `{ data, total, page, limit, totalPages }` for lists.
**Errors:** `{ error: { code, message, details?, requestId } }`

---

## Table of Contents

1. [Auth & Session](#1-auth--session)
2. [Student Profile & Dashboard](#2-student-profile--dashboard)
3. [Academic Journey & Enrollment History](#3-academic-journey--enrollment-history)
4. [Timetable](#4-timetable)
5. [Results](#5-results)
6. [Attendance](#6-attendance)
7. [Faculty Notes — View & Download](#7-faculty-notes--view--download)
8. [Self Notes](#8-self-notes)
9. [Quizzes — Attempt & Review](#9-quizzes--attempt--review)
10. [Announcements](#10-announcements)
11. [Calendar](#11-calendar)
12. [Mentor Chat](#12-mentor-chat)
13. [AI Assistant](#13-ai-assistant)
14. [Study Planner](#14-study-planner)
15. [Leaderboard](#15-leaderboard)
16. [Student Error Codes](#16-student-error-codes)

---

## 1. Auth & Session

### `POST /auth/login`
Student login. `email` field also accepts `enrollment_no` as the identifier.

**Auth required:** No

**Request Body**
```json
{
  "email": "LJ20IT045",
  "password": "LJ20IT045@123",
  "role": "STUDENT"
}
```

`email` accepts either email address (`kavy@lj.edu`) or enrollment number (`LJ20IT045`).
Default password on first login is `{enrollmentNo}@123` — student must change on first login.

**Response `200 OK`**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "8f14e45fceea167a5a36...",
  "expiresIn": 900,
  "user": {
    "id": "stu_4521",
    "enrollmentNo": "LJ20IT045",
    "name": "Kavy Thakar",
    "email": "kavy@lj.edu",
    "role": "STUDENT",
    "universityId": "univ_lju_01",
    "branch": "IT",
    "isFirstLogin": true
  }
}
```

`isFirstLogin: true` signals the frontend to redirect to the change-password screen before allowing further navigation.

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
Current student identity — called on app load to restore session.

**Response `200 OK`**
```json
{
  "id": "stu_4521",
  "enrollmentNo": "LJ20IT045",
  "name": "Kavy Thakar",
  "email": "kavy@lj.edu",
  "branch": "IT",
  "admissionYear": 2023,
  "profilePhotoUrl": null,
  "phone": "9876543210",
  "university": { "id": "univ_lju_01", "name": "LJ University", "slug": "lju" }
}
```

---

### `POST /auth/forgot-password`
Sends reset link to the student's registered email.

**Request Body**
```json
{ "email": "kavy@lj.edu" }
```

**Response `200 OK`**
```json
{ "message": "If this email exists, a reset link has been sent." }
```

---

## 2. Student Profile & Dashboard

### `GET /student/dashboard`
Powers the entire student dashboard in a single call — stat cards, quick links, upcoming events, recent activity.

**Response `200 OK`**
```json
{
  "student": {
    "enrollmentNo": "LJ20IT045",
    "name": "Kavy Thakar",
    "branch": "IT"
  },
  "currentEnrollment": {
    "semesterLabel": "Semester 3",
    "yearLevel": "SY",
    "batchCode": "C2",
    "rollNo": "IT-24-045",
    "academicYear": "2026-27"
  },
  "stats": {
    "overallAttendancePct": 68.4,
    "attendanceStatus": "AT_RISK",
    "subjectsBelowThreshold": 3,
    "latestPhaseLabel": "T2",
    "latestPhaseAvgPct": 35.0,
    "pendingQuizzes": 2,
    "unreadAnnouncements": 4,
    "unreadMentorMessages": 2
  },
  "upcomingEvents": [
    { "id": "evt_201", "title": "T3 Phase Start", "date": "2026-07-04", "type": "PHASE" },
    { "id": "evt_202", "title": "Independence Day", "date": "2026-07-14", "type": "HOLIDAY" }
  ],
  "recentResults": [
    { "phase": "T2", "subjectCode": "COA", "marks": 35, "maxMarks": 100, "grade": "F" },
    { "phase": "T2", "subjectCode": "DM", "marks": 41, "maxMarks": 100, "grade": "F" }
  ],
  "mentor": {
    "name": "Dr. Mehul Rana",
    "mentorCode": "SYD",
    "unreadMessages": 2
  }
}
```

---

### `GET /student/profile`
Full student profile for the Settings / Profile page.

**Response `200 OK`**
```json
{
  "enrollmentNo": "LJ20IT045",
  "name": "Kavy Thakar",
  "email": "kavy@lj.edu",
  "phone": "9876543210",
  "branch": "IT",
  "admissionYear": 2023,
  "profilePhotoUrl": null,
  "currentEnrollment": {
    "batchCode": "C2",
    "rollNo": "IT-24-045",
    "semesterLabel": "Semester 3",
    "yearLevel": "SY"
  }
}
```

---

### `PATCH /student/profile`
Update own profile — only name, phone, and profilePhotoUrl are editable.
Email, enrollmentNo, branch are read-only (set by HOD).

**Request Body**
```json
{
  "name": "Kavy A. Thakar",
  "phone": "9876543211"
}
```

**Response `200 OK`** — updated profile object

**Errors:** `400 READONLY_FIELD` if email, enrollmentNo, or branch is included

---

### `POST /student/profile/photo`
Upload a profile photo.

**Request:** `multipart/form-data`

| Field | Type | Notes |
|---|---|---|
| `file` | File | JPG / PNG — max 2MB |

**Response `200 OK`**
```json
{ "profilePhotoUrl": "https://s3.ap-south-1.amazonaws.com/.../profiles/stu_4521.jpg" }
```

---

### `PATCH /student/profile/password`
Change own password. First-login forced password change uses this same endpoint.

**Request Body**
```json
{
  "currentPassword": "LJ20IT045@123",
  "newPassword": "MyNewPass@456",
  "confirmPassword": "MyNewPass@456"
}
```

**Response `200 OK`**
```json
{ "message": "Password updated successfully", "isFirstLogin": false }
```

**Errors:** `401 CURRENT_PASSWORD_INCORRECT`, `400 PASSWORDS_DO_NOT_MATCH`, `400 PASSWORD_TOO_WEAK`

---

### `GET /student/sessions`
Active login sessions for security settings.

**Response `200 OK`**
```json
{
  "data": [
    {
      "id": "sess_1",
      "device": "Chrome on Windows",
      "ip": "103.21.44.xx",
      "isCurrent": true,
      "lastActive": "2026-06-30T12:00:00Z"
    },
    {
      "id": "sess_2",
      "device": "Chrome on Android",
      "ip": "103.21.44.xx",
      "isCurrent": false,
      "lastActive": "2026-06-29T18:00:00Z"
    }
  ]
}
```

---

### `DELETE /student/sessions/:sessionId`
Revoke a non-current session.

**Response `204 No Content`**

**Errors:** `400 CANNOT_REVOKE_CURRENT_SESSION`

---

## 3. Academic Journey & Enrollment History

### `GET /student/enrollment/current`
Current semester enrollment — batch, roll no, year level.
Used by the student app everywhere a context banner is shown.

**Response `200 OK`**
```json
{
  "id": "enr_4521",
  "enrollmentNo": "LJ20IT045",
  "semesterId": "sem_3",
  "semesterLabel": "Semester 3",
  "semesterNumber": 3,
  "yearLevel": "SY",
  "batchCode": "C2",
  "rollNo": "IT-24-045",
  "academicYear": "2026-27",
  "startDate": "2026-07-01",
  "endDate": "2026-12-15"
}
```

---

### `GET /student/enrollment/history`
Full academic journey — all semesters from sem 1 to current.
Powers the "Academic Journey" timeline in the student profile.

**Response `200 OK`**
```json
{
  "enrollmentNo": "LJ20IT045",
  "branch": "IT",
  "admissionYear": 2023,
  "journey": [
    {
      "semesterNumber": 1,
      "semesterLabel": "Semester 1",
      "yearLevel": "FY",
      "batchCode": "B3",
      "rollNo": "IT-23-012",
      "academicYear": "2023-24",
      "isCurrent": false,
      "promotedFromId": null
    },
    {
      "semesterNumber": 2,
      "semesterLabel": "Semester 2",
      "yearLevel": "FY",
      "batchCode": "B1",
      "rollNo": "IT-23-045",
      "academicYear": "2023-24",
      "isCurrent": false,
      "promotedFromId": "enr_0901"
    },
    {
      "semesterNumber": 3,
      "semesterLabel": "Semester 3",
      "yearLevel": "SY",
      "batchCode": "C2",
      "rollNo": "IT-24-045",
      "academicYear": "2024-25",
      "isCurrent": true,
      "promotedFromId": "enr_1022"
    }
  ]
}
```

---

### `GET /student/subjects`
All subjects the student has this semester (based on their batch enrollment).

**Query Params:** `?semesterId=` (defaults to current)

**Response `200 OK`**
```json
{
  "semesterLabel": "Semester 3",
  "subjects": [
    {
      "id": "subj_coa",
      "code": "COA",
      "name": "Computer Organization & Architecture",
      "credits": 4,
      "type": "THEORY",
      "facultyName": "Dr. Mehul Rana"
    },
    {
      "id": "subj_dm",
      "code": "DM",
      "name": "Discrete Mathematics",
      "credits": 4,
      "type": "THEORY",
      "facultyName": "Prof. Sneha Jain"
    },
    {
      "id": "subj_fsd2",
      "code": "FSD-2",
      "name": "Full Stack Development 2",
      "credits": 4,
      "type": "LAB",
      "facultyName": "Dr. Mehul Rana"
    },
    {
      "id": "subj_fcsp2",
      "code": "FCSP-2",
      "name": "Foundation of CS Practical 2",
      "credits": 2,
      "type": "PRACTICAL",
      "facultyName": "Dr. Amit Solanki"
    },
    {
      "id": "subj_toc",
      "code": "TOC",
      "name": "Theory of Computation",
      "credits": 4,
      "type": "THEORY",
      "facultyName": "Prof. Kiran Trivedi"
    }
  ],
  "totalCredits": 18
}
```

---

## 4. Timetable

### `GET /student/timetable`
Weekly timetable for the student's current batch.

**Query Params:** `?semesterId=` (defaults to current)

**Response `200 OK`**
```json
{
  "batchCode": "C2",
  "semesterLabel": "Semester 3",
  "slots": [
    {
      "id": "slot_881",
      "dayOfWeek": 1,
      "dayLabel": "Monday",
      "slotStart": "09:00",
      "slotEnd": "10:00",
      "subject": {
        "code": "COA",
        "name": "Computer Organization & Architecture"
      },
      "faculty": { "name": "Dr. Mehul Rana" },
      "room": "Hall B"
    },
    {
      "id": "slot_882",
      "dayOfWeek": 1,
      "dayLabel": "Monday",
      "slotStart": "11:00",
      "slotEnd": "12:00",
      "subject": { "code": "DM", "name": "Discrete Mathematics" },
      "faculty": { "name": "Prof. Sneha Jain" },
      "room": "Hall A"
    },
    {
      "id": "slot_883",
      "dayOfWeek": 3,
      "dayLabel": "Wednesday",
      "slotStart": "14:00",
      "slotEnd": "16:00",
      "subject": { "code": "FSD-2", "name": "Full Stack Development 2" },
      "faculty": { "name": "Dr. Mehul Rana" },
      "room": "Lab 3"
    }
  ]
}
```

---

### `GET /student/timetable/today`
Today's schedule only — used for dashboard "Today's Classes" card.

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
      "faculty": { "name": "Dr. Mehul Rana" },
      "room": "Hall B"
    }
  ]
}
```

---

## 5. Results

Student can only see results that have `isPublished = true`.

### `GET /student/results`
All published results across all semesters, grouped by semester → phase → subject.

**Query Params:** `?semesterId=` (optional — omit to get all history)

**Response `200 OK`**
```json
{
  "enrollmentNo": "LJ20IT045",
  "semesters": [
    {
      "semesterLabel": "Semester 3",
      "semesterNumber": 3,
      "yearLevel": "SY",
      "batchCode": "C2",
      "academicYear": "2026-27",
      "phases": [
        {
          "phaseLabel": "T1",
          "phaseNumber": 1,
          "subjects": [
            {
              "subjectCode": "COA",
              "subjectName": "Computer Organization & Architecture",
              "marksObtained": 28,
              "maxMarks": 100,
              "grade": "F",
              "isPublished": true,
              "publishedAt": "2026-03-22T10:00:00Z"
            },
            {
              "subjectCode": "DM",
              "subjectName": "Discrete Mathematics",
              "marksObtained": 41,
              "maxMarks": 100,
              "grade": "D",
              "isPublished": true,
              "publishedAt": "2026-03-22T10:00:00Z"
            }
          ],
          "phaseAvgPct": 34.5,
          "phaseTotalMarks": 69,
          "phaseMaxMarks": 200
        },
        {
          "phaseLabel": "T2",
          "phaseNumber": 2,
          "subjects": [
            {
              "subjectCode": "COA",
              "subjectName": "Computer Organization & Architecture",
              "marksObtained": 35,
              "maxMarks": 100,
              "grade": "F",
              "isPublished": true,
              "publishedAt": "2026-05-20T10:00:00Z"
            }
          ],
          "phaseAvgPct": 35.0,
          "phaseTotalMarks": 35,
          "phaseMaxMarks": 100
        },
        {
          "phaseLabel": "T3",
          "phaseNumber": 3,
          "subjects": [],
          "phaseAvgPct": null,
          "status": "pending"
        },
        {
          "phaseLabel": "T4",
          "phaseNumber": 4,
          "subjects": [],
          "phaseAvgPct": null,
          "status": "pending"
        }
      ],
      "semesterAvgPct": 34.8
    },
    {
      "semesterLabel": "Semester 2",
      "semesterNumber": 2,
      "yearLevel": "FY",
      "batchCode": "B1",
      "academicYear": "2023-24",
      "phases": [
        {
          "phaseLabel": "T1",
          "subjects": [
            { "subjectCode": "BEE", "marksObtained": 62, "maxMarks": 100, "grade": "C", "isPublished": true }
          ]
        }
      ],
      "semesterAvgPct": 62.0
    }
  ]
}
```

---

### `GET /student/results/summary`
Lightweight summary — one row per semester for the results overview card.

**Response `200 OK`**
```json
{
  "summary": [
    { "semesterNumber": 1, "label": "Sem 1", "yearLevel": "FY", "avgPct": 58.2, "status": "complete" },
    { "semesterNumber": 2, "label": "Sem 2", "yearLevel": "FY", "avgPct": 62.0, "status": "complete" },
    { "semesterNumber": 3, "label": "Sem 3", "yearLevel": "SY", "avgPct": 35.0, "status": "in_progress" }
  ]
}
```

---

### `GET /student/results/semester/:semesterId`
Detailed results for one specific semester — all phases, all subjects.

**Guard:** `semesterId` must belong to one of the student's `StudentEnrollment` rows.

**Response `200 OK`** — same phase/subject shape as the relevant entry inside `GET /student/results`

---

### `GET /student/results/phase-progress`
Visual progress bar data for all phases of the current semester.
Used by the dashboard phase-progress widget.

**Response `200 OK`**
```json
{
  "semesterLabel": "Semester 3",
  "phases": [
    { "label": "T1", "number": 1, "avgPct": 34.5, "isPublished": true, "examDate": "2026-03-20" },
    { "label": "T2", "number": 2, "avgPct": 35.0, "isPublished": true, "examDate": "2026-05-15" },
    { "label": "T3", "number": 3, "avgPct": null, "isPublished": false, "examDate": "2026-08-25" },
    { "label": "T4", "number": 4, "avgPct": null, "isPublished": false, "examDate": "2026-10-20" }
  ]
}
```

---

## 6. Attendance

### `GET /student/attendance`
Per-subject attendance for the current (or specified) semester.
Also returns the configurable threshold from `AttendanceRules`.

**Query Params:** `?semesterId=` (defaults to current)

**Response `200 OK`**
```json
{
  "semesterLabel": "Semester 3",
  "threshold": 75,
  "warningThreshold": 80,
  "overallPct": 68.4,
  "overallStatus": "AT_RISK",
  "subjects": [
    {
      "subjectId": "subj_coa",
      "subjectCode": "COA",
      "subjectName": "Computer Organization & Architecture",
      "totalLectures": 24,
      "attended": 16,
      "absent": 8,
      "percentage": 66.67,
      "status": "AT_RISK",
      "isBelowThreshold": true,
      "isBelowWarning": true,
      "lecturesNeededToReach75": 8,
      "lecturesNeededToReach85": 22
    },
    {
      "subjectId": "subj_dm",
      "subjectCode": "DM",
      "subjectName": "Discrete Mathematics",
      "totalLectures": 22,
      "attended": 16,
      "absent": 6,
      "percentage": 72.73,
      "status": "WARNING",
      "isBelowThreshold": true,
      "isBelowWarning": true,
      "lecturesNeededToReach75": 2,
      "lecturesNeededToReach85": 11
    }
  ]
}
```

`lecturesNeededToReach75` and `lecturesNeededToReach85` are computed fields:
- Assuming student attends ALL remaining lectures
- Formula: `ceil((threshold * totalFutureLectures - attended) / (1 - threshold/100))`

---

### `GET /student/attendance/:subjectId/log`
Lecture-level date log for one subject — used in the attendance detail/calendar drill-down.

**Response `200 OK`**
```json
{
  "subjectCode": "COA",
  "subjectName": "Computer Organization & Architecture",
  "totalLectures": 24,
  "attended": 16,
  "percentage": 66.67,
  "log": [
    { "date": "2026-06-02", "isPresent": false, "markedBy": "Dr. Mehul Rana" },
    { "date": "2026-06-05", "isPresent": true, "markedBy": "Dr. Mehul Rana" },
    { "date": "2026-06-09", "isPresent": true, "markedBy": "Dr. Mehul Rana" },
    { "date": "2026-06-12", "isPresent": false, "markedBy": "Dr. Mehul Rana" }
  ]
}
```

---

### `GET /student/attendance/history`
Attendance summary across all past semesters — for profile history view.

**Response `200 OK`**
```json
{
  "history": [
    {
      "semesterLabel": "Semester 1",
      "academicYear": "2023-24",
      "overallPct": 82.4
    },
    {
      "semesterLabel": "Semester 2",
      "academicYear": "2023-24",
      "overallPct": 79.1
    },
    {
      "semesterLabel": "Semester 3",
      "academicYear": "2026-27",
      "overallPct": 68.4
    }
  ]
}
```

---

## 7. Faculty Notes — View & Download

Students can view notes uploaded by faculty for subjects in their current batch.

### `GET /student/notes`
List all faculty-uploaded notes for the student's current semester subjects.

**Query Params**

| Param | Type | Description |
|---|---|---|
| `subjectId` | uuid | Filter by subject |
| `search` | string | Match title or description |
| `page`, `limit` | int | Pagination |

**Response `200 OK`**
```json
{
  "data": [
    {
      "id": "note_221",
      "subjectCode": "COA",
      "subjectName": "Computer Organization & Architecture",
      "title": "Pipelining & CPU Design",
      "description": "Covers 5-stage pipeline, hazards, and solutions.",
      "mimeType": "application/pdf",
      "fileSizeKb": 1240,
      "hasAiSummary": true,
      "hasFlashcards": true,
      "flashcardCount": 8,
      "uploadedBy": "Dr. Mehul Rana",
      "createdAt": "2026-06-29T14:30:00Z"
    }
  ],
  "total": 14, "page": 1, "limit": 20, "totalPages": 1
}
```

---

### `GET /student/notes/:noteId`
Full note detail — title, description, AI summary, flashcards.

**Guard:** Note's subject must be in the student's current batch enrollment.

**Response `200 OK`**
```json
{
  "id": "note_221",
  "subjectCode": "COA",
  "subjectName": "Computer Organization & Architecture",
  "title": "Pipelining & CPU Design",
  "description": "Covers 5-stage pipeline, hazards, and solutions.",
  "mimeType": "application/pdf",
  "fileSizeKb": 1240,
  "uploadedBy": "Dr. Mehul Rana",
  "createdAt": "2026-06-29T14:30:00Z",
  "aiSummary": "This note covers the 5-stage instruction pipeline including Instruction Fetch (IF), Instruction Decode (ID), Execute (EX), Memory Access (MEM), and Write Back (WB). Key hazard types — structural, data, and control — are explained with resolution techniques including forwarding and branch prediction.",
  "flashcards": [
    { "id": "fc_1", "question": "What is a pipeline hazard?", "answer": "A situation that prevents the next instruction from executing in the next clock cycle.", "order": 1 },
    { "id": "fc_2", "question": "Name the three types of pipeline hazards.", "answer": "Structural, Data, and Control hazards.", "order": 2 },
    { "id": "fc_3", "question": "What is forwarding (bypassing) in a pipeline?", "answer": "A technique to pass ALU results directly to a subsequent instruction without waiting for the WB stage.", "order": 3 }
  ]
}
```

---

### `GET /student/notes/:noteId/download`
Returns a presigned S3 URL for downloading/viewing the note file.
URL expires in 15 minutes.

**Response `200 OK`**
```json
{
  "downloadUrl": "https://s3.ap-south-1.amazonaws.com/uniportal-files/notes/note_221.pdf?X-Amz-Expires=900&...",
  "expiresAt": "2026-06-30T12:15:00Z",
  "mimeType": "application/pdf",
  "filename": "Pipelining_CPU_Design_COA.pdf"
}
```

---

### `GET /student/notes/:noteId/flashcards`
Flashcards only — used by the flashcard review/flip-card mode.

**Response `200 OK`**
```json
{
  "noteTitle": "Pipelining & CPU Design",
  "subjectCode": "COA",
  "flashcards": [
    { "id": "fc_1", "question": "What is a pipeline hazard?", "answer": "A situation that prevents the next instruction from executing in the next clock cycle.", "order": 1 },
    { "id": "fc_2", "question": "Name the three types of pipeline hazards.", "answer": "Structural, Data, and Control hazards.", "order": 2 }
  ],
  "total": 8
}
```

---

## 8. Self Notes

Student's own private notes — only visible to them. Not shared with faculty or HOD.

### `GET /student/self-notes`
List all self-notes for the calling student.

**Query Params**

| Param | Type | Description |
|---|---|---|
| `subjectId` | uuid | Filter by linked subject |
| `search` | string | Match title or content |
| `page`, `limit` | int | Pagination |

**Response `200 OK`**
```json
{
  "data": [
    {
      "id": "sn_881",
      "title": "My COA Revision Notes",
      "subjectCode": "COA",
      "contentPreview": "Pipeline stages: IF → ID → EX → MEM → WB...",
      "createdAt": "2026-06-25T10:00:00Z",
      "updatedAt": "2026-06-28T14:00:00Z"
    },
    {
      "id": "sn_882",
      "title": "DM Set Theory Summary",
      "subjectCode": "DM",
      "contentPreview": "Sets, relations, functions — key definitions...",
      "createdAt": "2026-06-20T09:00:00Z",
      "updatedAt": "2026-06-20T09:00:00Z"
    }
  ],
  "total": 7, "page": 1, "limit": 20, "totalPages": 1
}
```

---

### `GET /student/self-notes/:selfNoteId`
Full self-note with complete content.

**Guard:** Self-note must belong to the calling student.

**Response `200 OK`**
```json
{
  "id": "sn_881",
  "title": "My COA Revision Notes",
  "subjectId": "subj_coa",
  "subjectCode": "COA",
  "content": "<h2>Pipeline Stages</h2><p>IF → ID → EX → MEM → WB</p>...",
  "createdAt": "2026-06-25T10:00:00Z",
  "updatedAt": "2026-06-28T14:00:00Z"
}
```

---

### `POST /student/self-notes`
Create a new self-note.

**Request Body**
```json
{
  "title": "My COA Revision Notes",
  "subjectId": "subj_coa",
  "content": "<h2>Pipeline Stages</h2><p>IF → ID → EX → MEM → WB</p>"
}
```

`subjectId` is optional — notes can be general (not linked to a subject).
`content` is rich-text HTML or TipTap JSON — stored as-is.

**Response `201 Created`**
```json
{
  "id": "sn_881",
  "title": "My COA Revision Notes",
  "subjectCode": "COA",
  "createdAt": "2026-06-25T10:00:00Z"
}
```

---

### `PUT /student/self-notes/:selfNoteId`
Full update of a self-note (title + content).

**Guard:** Self-note must belong to the calling student.

**Request Body**
```json
{
  "title": "My COA Revision Notes — Updated",
  "content": "<h2>Pipeline Stages</h2><p>IF → ID → EX → MEM → WB</p><h2>Hazards</h2>..."
}
```

**Response `200 OK`** — Updated self-note object

---

### `DELETE /student/self-notes/:selfNoteId`
Permanently delete a self-note (hard delete — no recovery).

**Guard:** Self-note must belong to the calling student.

**Response `204 No Content`**

---

## 9. Quizzes — Attempt & Review

### `GET /student/quizzes`
List all published quizzes available to the student for their current semester subjects.

**Query Params:** `?subjectId=&status=PENDING|ATTEMPTED|EXPIRED&page=1&limit=20`

`status` filter:
- `PENDING` — published, due date not passed, not yet attempted
- `ATTEMPTED` — student has submitted an attempt
- `EXPIRED` — due date passed, not attempted

**Response `200 OK`**
```json
{
  "data": [
    {
      "id": "quiz_331",
      "title": "T2 Practice — Pipeline & Cache",
      "subjectCode": "COA",
      "subjectName": "Computer Organization & Architecture",
      "questionCount": 10,
      "timeLimitMins": 20,
      "isAiGenerated": true,
      "dueDate": "2026-07-10T23:59:00Z",
      "status": "PENDING",
      "attemptedAt": null,
      "score": null
    },
    {
      "id": "quiz_290",
      "title": "DM Chapter 1 — Sets & Relations",
      "subjectCode": "DM",
      "questionCount": 15,
      "timeLimitMins": null,
      "dueDate": "2026-06-20T23:59:00Z",
      "status": "ATTEMPTED",
      "attemptedAt": "2026-06-18T14:22:00Z",
      "score": 73.3
    }
  ],
  "total": 6, "page": 1, "limit": 20, "totalPages": 1
}
```

---

### `GET /student/quizzes/:quizId`
Quiz details before attempting — shows title, subject, time limit, question count but NOT questions/answers yet.

**Guard:** Quiz must be published and subject must be in student's current semester.

**Response `200 OK`**
```json
{
  "id": "quiz_331",
  "title": "T2 Practice — Pipeline & Cache",
  "description": "10 MCQs covering T2 syllabus for COA.",
  "subjectCode": "COA",
  "questionCount": 10,
  "timeLimitMins": 20,
  "dueDate": "2026-07-10T23:59:00Z",
  "isAiGenerated": true,
  "status": "PENDING",
  "alreadyAttempted": false
}
```

**Errors:** `404 NOT_FOUND`, `403 SUBJECT_NOT_IN_ENROLLMENT`, `410 QUIZ_EXPIRED`

---

### `POST /student/quizzes/:quizId/start`
Start a quiz attempt — returns all questions. Timer starts from this call.
A student can only start each quiz once.

**Guard:** Quiz must be published, not expired, and not already attempted.

**Response `201 Created`**
```json
{
  "attemptId": "att_001",
  "quizId": "quiz_331",
  "title": "T2 Practice — Pipeline & Cache",
  "timeLimitMins": 20,
  "startedAt": "2026-06-30T11:00:00Z",
  "expiresAt": "2026-06-30T11:20:00Z",
  "questions": [
    {
      "id": "qst_1",
      "order": 1,
      "text": "Which stage of the pipeline executes the ALU operations?",
      "options": [
        { "id": "A", "text": "IF — Instruction Fetch" },
        { "id": "B", "text": "ID — Instruction Decode" },
        { "id": "C", "text": "EX — Execute" },
        { "id": "D", "text": "WB — Write Back" }
      ]
    },
    {
      "id": "qst_2",
      "order": 2,
      "text": "What type of hazard occurs when two instructions require the same hardware resource simultaneously?",
      "options": [
        { "id": "A", "text": "Data hazard" },
        { "id": "B", "text": "Structural hazard" },
        { "id": "C", "text": "Control hazard" },
        { "id": "D", "text": "Resource hazard" }
      ]
    }
  ]
}
```

**Errors:** `409 ALREADY_ATTEMPTED`, `410 QUIZ_EXPIRED`, `403 SUBJECT_NOT_IN_ENROLLMENT`

---

### `POST /student/quizzes/:quizId/submit`
Submit a completed attempt with all answers.

**Request Body**
```json
{
  "answers": {
    "qst_1": "C",
    "qst_2": "B",
    "qst_3": "A",
    "qst_4": "D"
  }
}
```

**Response `200 OK`**
```json
{
  "attemptId": "att_001",
  "score": 70.0,
  "correctCount": 7,
  "incorrectCount": 3,
  "totalQuestions": 10,
  "submittedAt": "2026-06-30T11:14:00Z",
  "results": [
    {
      "questionId": "qst_1",
      "questionText": "Which stage of the pipeline executes the ALU operations?",
      "selectedOption": "C",
      "correctOption": "C",
      "isCorrect": true,
      "explanation": "The Execute (EX) stage performs arithmetic and logic operations using the ALU."
    },
    {
      "questionId": "qst_2",
      "questionText": "What type of hazard occurs when two instructions require the same hardware resource simultaneously?",
      "selectedOption": "D",
      "correctOption": "B",
      "isCorrect": false,
      "explanation": "A Structural hazard occurs when two instructions need the same hardware resource at the same time."
    }
  ]
}
```

**Errors:** `409 ALREADY_SUBMITTED`, `400 MISSING_ANSWERS` (some questions unanswered), `410 TIME_LIMIT_EXCEEDED`

---

### `GET /student/quizzes/:quizId/result`
View the result and answer review for a previously attempted quiz.

**Guard:** Student must have already attempted the quiz.

**Response `200 OK`** — same shape as the `POST /submit` response (`attemptId`, `score`, `correctCount`, `results[]`)

---

### `GET /student/quizzes/history`
All quiz attempts with scores — for performance tracking.

**Query Params:** `?subjectId=&semesterId=&page=1&limit=20`

**Response `200 OK`**
```json
{
  "data": [
    {
      "quizId": "quiz_331",
      "title": "T2 Practice — Pipeline & Cache",
      "subjectCode": "COA",
      "score": 70.0,
      "totalQuestions": 10,
      "submittedAt": "2026-06-30T11:14:00Z"
    }
  ],
  "total": 4, "page": 1, "limit": 20, "totalPages": 1
}
```

---

## 10. Announcements

### `GET /student/announcements`
All announcements visible to this student — scoped by batch and year level.

**Query Params:** `?page=1&limit=20&unreadOnly=false`

Visibility logic applied server-side:
```
WHERE scope = 'ALL'
OR (scope = 'BATCH' AND scopeValue = student.currentBatchId)
OR (scope = 'YEAR_LEVEL' AND scopeValue = student.currentYearLevel)
```

**Response `200 OK`**
```json
{
  "data": [
    {
      "id": "ann_771",
      "title": "Semester 3 Schedule Update",
      "body": "Please note the revised timetable effective from July 4th onwards.",
      "senderName": "Dr. Rajesh Patel",
      "senderRole": "HOD",
      "scope": "ALL",
      "scopeLabel": "All Students",
      "isRead": false,
      "createdAt": "2026-06-29T09:00:00Z"
    },
    {
      "id": "ann_772",
      "title": "COA Assignment Reminder",
      "body": "Submit your pipeline design assignment by Friday.",
      "senderName": "Dr. Mehul Rana",
      "senderRole": "FACULTY",
      "scope": "BATCH",
      "scopeLabel": "Batch C2",
      "isRead": true,
      "createdAt": "2026-06-28T11:00:00Z"
    }
  ],
  "unreadCount": 4,
  "total": 18, "page": 1, "limit": 20, "totalPages": 1
}
```

---

### `GET /student/announcements/:announcementId`
Single announcement full detail.

**Response `200 OK`**
```json
{
  "id": "ann_771",
  "title": "Semester 3 Schedule Update",
  "body": "Please note the revised timetable effective from July 4th onwards. New slots for COA are Monday and Thursday 9–10 AM.",
  "senderName": "Dr. Rajesh Patel",
  "senderRole": "HOD",
  "scope": "ALL",
  "isRead": false,
  "createdAt": "2026-06-29T09:00:00Z"
}
```

---

### `PATCH /student/announcements/:announcementId/read`
Mark a specific announcement as read.

**Response `200 OK`**
```json
{ "announcementId": "ann_771", "isRead": true, "readAt": "2026-06-30T12:00:00Z" }
```

---

### `PATCH /student/announcements/mark-all-read`
Mark all unread announcements as read (called when student opens the announcement page).

**Response `200 OK`**
```json
{ "markedRead": 4 }
```

---

### `GET /student/announcements/unread-count`
Lightweight endpoint — just the unread count for the sidebar badge.

**Response `200 OK`**
```json
{ "unreadCount": 4 }
```

---

## 11. Calendar

### `GET /student/calendar/events`
All calendar events visible to students (`visibleTo = ALL`) for a given month.

**Query Params:** `?year=2026&month=7`

**Response `200 OK`**
```json
{
  "data": [
    { "id": "evt_201", "date": "2026-07-04", "title": "T3 Phase Start", "type": "PHASE", "description": null },
    { "id": "evt_202", "date": "2026-07-14", "title": "Independence Day", "type": "HOLIDAY", "description": "University closed." },
    { "id": "evt_203", "date": "2026-07-20", "title": "Mid-Sem Cultural Fest", "type": "CULTURAL", "description": "Annual inter-department cultural competition." }
  ]
}
```

---

### `GET /student/calendar/events/upcoming`
Next N upcoming events from today.

**Query Params:** `?limit=5`

**Response `200 OK`**
```json
{
  "data": [
    { "id": "evt_201", "date": "2026-07-04", "title": "T3 Phase Start", "type": "PHASE", "daysAway": 4 },
    { "id": "evt_202", "date": "2026-07-14", "title": "Independence Day", "type": "HOLIDAY", "daysAway": 14 }
  ]
}
```

---

### `GET /student/calendar/phase-timeline`
Phase exam dates and status for the active semester.
Used by student for exam planning.

**Response `200 OK`**
```json
{
  "semesterLabel": "Semester 3",
  "phases": [
    { "label": "T1", "number": 1, "startDate": "2026-02-01", "endDate": "2026-03-15", "examDate": "2026-03-20", "isComplete": true },
    { "label": "T2", "number": 2, "startDate": "2026-03-21", "endDate": "2026-05-10", "examDate": "2026-05-15", "isComplete": true },
    { "label": "T3", "number": 3, "startDate": "2026-07-04", "endDate": "2026-08-20", "examDate": "2026-08-25", "isComplete": false, "daysUntilExam": 56 },
    { "label": "T4", "number": 4, "startDate": "2026-09-01", "endDate": "2026-10-15", "examDate": "2026-10-20", "isComplete": false }
  ]
}
```

---

## 12. Mentor Chat

A student has exactly one mentor assigned per semester (if HOD has assigned one).
Student and mentor communicate via a 1:1 persistent chat room.

### `GET /student/mentor`
Returns the student's assigned mentor for the current semester.

**Response `200 OK`**
```json
{
  "mentorAssignmentId": "ma_8821",
  "mentor": {
    "name": "Dr. Mehul Rana",
    "department": "IT",
    "mentorCode": "SYD",
    "profilePhotoUrl": null
  },
  "unreadMessages": 2,
  "lastMessageAt": "2026-06-30T09:43:00Z"
}
```

**If no mentor assigned:**
```json
{
  "mentorAssignmentId": null,
  "mentor": null,
  "message": "No mentor has been assigned to you for this semester. Contact your HOD."
}
```

---

### `GET /student/mentor/messages`
Paginated chat history with mentor. Ascending `sentAt` order (oldest first).

**Query Params:** `?page=1&limit=30`

**Guard:** Student must have an active `MentorAssignment` for this semester.

**Response `200 OK`**
```json
{
  "mentorAssignmentId": "ma_8821",
  "mentor": { "name": "Dr. Mehul Rana", "mentorCode": "SYD" },
  "data": [
    {
      "id": "msg_440",
      "senderRole": "FACULTY",
      "senderName": "Dr. Mehul Rana",
      "content": "Hi Kavy, how are you doing this semester?",
      "isRead": true,
      "sentAt": "2026-06-28T10:00:00Z"
    },
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

### `POST /student/mentor/messages`
Send a message to the assigned mentor.

**Guard:** Student must have an active `MentorAssignment` for this semester.

**Request Body**
```json
{ "content": "Sir, I need help understanding data hazards in pipelines." }
```

**Response `201 Created`**
```json
{
  "id": "msg_444",
  "senderRole": "STUDENT",
  "content": "Sir, I need help understanding data hazards in pipelines.",
  "sentAt": "2026-06-30T11:00:00Z"
}
```

**Errors:** `404 NO_MENTOR_ASSIGNED`, `400 EMPTY_MESSAGE`

---

### `PATCH /student/mentor/messages/mark-read`
Mark all unread messages from mentor as read (on opening chat window).

**Response `200 OK`**
```json
{ "markedRead": 2 }
```

---

### `GET /student/mentor/messages/unread-count`
Lightweight — just the unread count for the sidebar badge.

**Response `200 OK`**
```json
{ "unreadCount": 2 }
```

---

### Socket.io Events (Student Client)

Student connects to Socket.io on login using their access token.

**Client → Server:**

| Event | Payload | Description |
|---|---|---|
| `join_room` | `{ mentorAssignmentId }` | Join mentor chat room |
| `leave_room` | `{ mentorAssignmentId }` | Leave the room |
| `send_message` | `{ mentorAssignmentId, content }` | Send message to mentor |
| `typing_start` | `{ mentorAssignmentId }` | Start typing indicator |
| `typing_stop` | `{ mentorAssignmentId }` | Stop typing indicator |
| `ping` | — | Heartbeat every 30s for presence |

**Server → Client:**

| Event | Payload | Description |
|---|---|---|
| `new_message` | `{ id, senderRole, senderName, content, sentAt, mentorAssignmentId }` | New message from mentor |
| `mentor_online` | `{ facultyId, mentorAssignmentId }` | Mentor came online |
| `mentor_offline` | `{ facultyId, mentorAssignmentId }` | Mentor went offline |
| `mentor_typing` | `{ mentorAssignmentId }` | Mentor is typing |
| `mentor_stopped_typing` | `{ mentorAssignmentId }` | Mentor stopped typing |
| `unread_update` | `{ unreadCount }` | Unread count changed |

---

## 13. AI Assistant

Backed by Django AI service — all requests proxied through Express.
Conversations are scoped per student, optionally per subject.

### `GET /student/ai/conversations`
List all AI conversation sessions for this student.

**Response `200 OK`**
```json
{
  "data": [
    {
      "id": "conv_441",
      "subjectCode": "COA",
      "subjectName": "Computer Organization & Architecture",
      "lastMessage": "Can you explain data forwarding?",
      "messageCount": 12,
      "updatedAt": "2026-06-30T10:30:00Z"
    },
    {
      "id": "conv_440",
      "subjectCode": null,
      "subjectName": "General",
      "lastMessage": "What topics are most likely in T3?",
      "messageCount": 5,
      "updatedAt": "2026-06-29T14:00:00Z"
    }
  ]
}
```

---

### `POST /student/ai/conversations`
Start a new AI conversation, optionally scoped to a subject.

**Request Body**
```json
{
  "subjectId": "subj_coa",
  "initialMessage": "Can you explain pipeline hazards in simple terms?"
}
```

`subjectId` is optional. If provided, the AI uses only RAG context from that subject's faculty notes and PYQ analysis.

**Response `201 Created`**
```json
{
  "conversationId": "conv_442",
  "subjectCode": "COA",
  "reply": "Sure! A pipeline hazard is any situation that prevents the next instruction from executing in the expected clock cycle. There are three types: Structural hazards occur when two instructions need the same hardware resource at the same time. Data hazards happen when an instruction depends on the result of a previous instruction that hasn't completed yet. Control hazards arise from branch instructions where the next instruction isn't known until the branch decision is made. Would you like me to explain each type in more detail with examples?"
}
```

---

### `GET /student/ai/conversations/:conversationId`
Load full message history for a conversation.

**Guard:** Conversation must belong to this student.

**Response `200 OK`**
```json
{
  "id": "conv_441",
  "subjectCode": "COA",
  "messages": [
    { "role": "user", "content": "Can you explain data forwarding?", "timestamp": "2026-06-30T10:15:00Z" },
    { "role": "assistant", "content": "Data forwarding (also called bypassing) is a technique used to resolve data hazards in a pipeline...", "timestamp": "2026-06-30T10:15:02Z" }
  ]
}
```

---

### `POST /student/ai/conversations/:conversationId/message`
Send a follow-up message in an existing conversation.

**Guard:** Conversation must belong to this student.

**Request Body**
```json
{ "content": "Can you give me an example of a load-use data hazard?" }
```

**Response `200 OK`**
```json
{
  "conversationId": "conv_441",
  "reply": "A load-use hazard is a classic example of a data hazard. Consider these two instructions: `LW R1, 0(R2)` followed by `ADD R3, R1, R4`. The ADD instruction needs R1, but the LW instruction won't have loaded it into R1 until the MEM stage, which is one cycle after the ADD needs it in the EX stage. Even with forwarding, a one-cycle stall (bubble) is required here..."
}
```

---

### `DELETE /student/ai/conversations/:conversationId`
Delete a conversation (clears all messages). Hard delete.

**Guard:** Conversation must belong to this student.

**Response `204 No Content`**

---

### `GET /student/ai/pyq-analysis/:subjectId`
Returns the PYQ topic frequency analysis for a subject — used in the Study Planner to highlight high-priority topics.

**Guard:** Subject must be in student's current semester.

**Response `200 OK`**
```json
{
  "subjectCode": "COA",
  "subjectName": "Computer Organization & Architecture",
  "analyzedAt": "2026-06-01T00:00:00Z",
  "topicFrequencies": [
    { "topic": "Pipelining", "frequency": 8, "priority": "HIGH" },
    { "topic": "Cache Memory", "frequency": 5, "priority": "HIGH" },
    { "topic": "Instruction Set Architecture", "frequency": 4, "priority": "MEDIUM" },
    { "topic": "Memory Hierarchy", "frequency": 3, "priority": "MEDIUM" },
    { "topic": "I/O Systems", "frequency": 1, "priority": "LOW" }
  ],
  "totalPYQsAnalyzed": 5
}
```

**Errors:** `404 PYQ_ANALYSIS_NOT_AVAILABLE` — if HOD hasn't uploaded PYQs or analysis isn't complete yet

---

### `GET /student/ai/smart-notes/:noteId/summary`
AI summary of a specific faculty note. Returns `aiSummary` field from the note.

**Guard:** Note's subject must be in student's current enrollment.

**Response `200 OK`**
```json
{
  "noteId": "note_221",
  "noteTitle": "Pipelining & CPU Design",
  "subjectCode": "COA",
  "summary": "This note covers the 5-stage instruction pipeline...",
  "generatedAt": "2026-06-29T15:00:00Z"
}
```

**Errors:** `404 SUMMARY_NOT_YET_GENERATED` — if Django AI job hasn't completed yet

---

## 14. Study Planner

Student's personal study schedule — stored as structured JSON, editable by the student.
AI can suggest a plan based on PYQ frequencies and upcoming exam dates.

### `GET /student/study-planner`
Returns the student's current study plan for the active semester.

**Response `200 OK`**
```json
{
  "semesterLabel": "Semester 3",
  "plan": [
    {
      "date": "2026-07-04",
      "sessions": [
        {
          "subjectCode": "COA",
          "topic": "Pipelining — Stages & Hazards",
          "durationMins": 90,
          "priority": "HIGH",
          "isCompleted": false
        }
      ]
    },
    {
      "date": "2026-07-05",
      "sessions": [
        {
          "subjectCode": "DM",
          "topic": "Set Theory & Relations",
          "durationMins": 60,
          "priority": "MEDIUM",
          "isCompleted": true
        },
        {
          "subjectCode": "COA",
          "topic": "Cache Memory",
          "durationMins": 60,
          "priority": "HIGH",
          "isCompleted": false
        }
      ]
    }
  ],
  "aiGenerated": true,
  "generatedAt": "2026-07-01T08:00:00Z"
}
```

---

### `PUT /student/study-planner`
Save or replace the entire study plan.

**Request Body**
```json
{
  "plan": [
    {
      "date": "2026-07-04",
      "sessions": [
        { "subjectCode": "COA", "topic": "Pipelining", "durationMins": 90, "priority": "HIGH", "isCompleted": false }
      ]
    }
  ]
}
```

**Response `200 OK`**
```json
{ "message": "Study plan saved", "sessionCount": 1 }
```

---

### `PATCH /student/study-planner/session`
Mark a single study session as completed/not completed.

**Request Body**
```json
{
  "date": "2026-07-04",
  "sessionIndex": 0,
  "isCompleted": true
}
```

**Response `200 OK`**
```json
{ "date": "2026-07-04", "sessionIndex": 0, "isCompleted": true }
```

---

### `POST /student/study-planner/ai-suggest`
Ask Django AI service to generate a suggested study plan.
Factors used: remaining phases, PYQ topic frequencies per subject, current marks (weakest subjects get more time), upcoming exam dates.

**Request Body**
```json
{
  "daysUntilExam": 56,
  "dailyHours": 3,
  "focusSubjects": ["COA", "DM"]
}
```

`focusSubjects` is optional — AI weights these subjects more heavily.

**Response `202 Accepted`**
```json
{
  "jobId": "study_plan_job_991",
  "status": "QUEUED",
  "message": "AI is generating your study plan. Poll /student/study-planner/ai-status/study_plan_job_991"
}
```

---

### `GET /student/study-planner/ai-status/:jobId`
Poll AI study plan generation status.

**Response `200 OK`**
```json
{
  "jobId": "study_plan_job_991",
  "status": "COMPLETE",
  "message": "Your study plan is ready. Call PUT /student/study-planner to save it."
}
```

`status` is `QUEUED | PROCESSING | COMPLETE | FAILED`.

When `COMPLETE`, call `GET /student/study-planner` to retrieve the generated plan (saved to DB by the AI job).

---

## 15. Leaderboard

### `GET /student/leaderboard`
Batch leaderboard — top performers in the student's own batch for a given phase.
Student can see their own rank.

**Query Params:** `?phaseId=&subjectId=` (optional — omit for overall)

**Response `200 OK`**
```json
{
  "batchCode": "C2",
  "phaseLabel": "T2",
  "myRank": 47,
  "myAvgPct": 35.0,
  "totalStudents": 50,
  "leaderboard": [
    { "rank": 1, "name": "Sena Raval", "enrollmentNo": "LJ21AIML009", "avgPct": 96.4, "isMe": false },
    { "rank": 2, "name": "Aneri Dave", "enrollmentNo": "LJ20CE001", "avgPct": 91.2, "isMe": false },
    { "rank": 3, "name": "Diya Shah", "enrollmentNo": "LJ21CE055", "avgPct": 89.8, "isMe": false },
    { "rank": 4, "name": "Pratik Joshi", "enrollmentNo": "LJ21CSE034", "avgPct": 87.6, "isMe": false },
    { "rank": 5, "name": "Vraj Mehta", "enrollmentNo": "LJ20RAI022", "avgPct": 85.4, "isMe": false },
    { "rank": 6, "name": "Mitul Shah", "enrollmentNo": "LJ20IT078", "avgPct": 82.1, "isMe": false },
    { "rank": 7, "name": "Riya Parmar", "enrollmentNo": "LJ20IT156", "avgPct": 80.7, "isMe": false },
    { "rank": 8, "name": "Darshan Modi", "enrollmentNo": "LJ21IT203", "avgPct": 78.3, "isMe": false },
    { "rank": 9, "name": "Het Patel", "enrollmentNo": "LJ21IT112", "avgPct": 74.2, "isMe": false },
    { "rank": 10, "name": "Kavy Thakar", "enrollmentNo": "LJ20IT045", "avgPct": 35.0, "isMe": true }
  ]
}
```

Privacy note: Only name and rank are shown — no phone, email, or roll number of other students.

---

### `GET /student/leaderboard/my-rank`
Lightweight — just the student's own rank and score for the sidebar/dashboard widget.

**Query Params:** `?phaseId=`

**Response `200 OK`**
```json
{
  "batchCode": "C2",
  "phaseLabel": "T2",
  "myRank": 47,
  "totalStudents": 50,
  "myAvgPct": 35.0,
  "percentile": 6.0
}
```

---

### `GET /student/leaderboard/subject/:subjectId`
Per-subject leaderboard for the student's batch.

**Query Params:** `?phaseId=`

**Response `200 OK`**
```json
{
  "subjectCode": "COA",
  "batchCode": "C2",
  "phaseLabel": "T2",
  "myRank": 49,
  "myMarks": 35,
  "maxMarks": 100,
  "topStudents": [
    { "rank": 1, "name": "Sena Raval", "marksObtained": 96, "isMe": false },
    { "rank": 2, "name": "Aneri Dave", "marksObtained": 91, "isMe": false }
  ]
}
```

---

## 16. Student Error Codes

| HTTP Status | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request body failed schema validation; `details[]` lists field errors |
| 400 | `READONLY_FIELD` | Tried to update a field managed by HOD (email, enrollmentNo, branch) |
| 400 | `PASSWORDS_DO_NOT_MATCH` | Password and confirmPassword don't match |
| 400 | `PASSWORD_TOO_WEAK` | New password doesn't meet strength requirements |
| 400 | `EMPTY_MESSAGE` | Chat message or AI message content is blank |
| 400 | `MISSING_ANSWERS` | Quiz submitted without answering all questions |
| 400 | `FUTURE_DATE` | Requested attendance log date is in the future |
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 401 | `TOKEN_EXPIRED` | Access token expired — call `/auth/refresh` |
| 401 | `CURRENT_PASSWORD_INCORRECT` | Wrong current password on change |
| 403 | `FORBIDDEN` | Route requires HOD or Faculty role |
| 403 | `SUBJECT_NOT_IN_ENROLLMENT` | Subject is not in student's current batch |
| 403 | `STUDENT_NOT_OWNER` | Trying to access another student's self-note, AI conversation, or quiz attempt |
| 403 | `CANNOT_REVOKE_CURRENT_SESSION` | Cannot revoke the currently active login session |
| 404 | `NOT_FOUND` | Resource doesn't exist or was soft-deleted |
| 404 | `NO_MENTOR_ASSIGNED` | Student has no mentor for this semester |
| 404 | `PYQ_ANALYSIS_NOT_AVAILABLE` | HOD hasn't uploaded PYQs or analysis not complete |
| 404 | `SUMMARY_NOT_YET_GENERATED` | AI summary hasn't been generated for this note |
| 409 | `ALREADY_ATTEMPTED` | Student already started this quiz |
| 409 | `ALREADY_SUBMITTED` | Quiz already submitted — cannot re-submit |
| 410 | `QUIZ_EXPIRED` | Quiz due date has passed |
| 410 | `TIME_LIMIT_EXCEEDED` | Quiz time limit expired before submission |

**Standard error response:**
```json
{
  "error": {
    "code": "SUBJECT_NOT_IN_ENROLLMENT",
    "message": "Subject TOC is not part of your current enrollment in Batch C2 — Semester 3.",
    "requestId": "req_x9y8z7"
  }
}
```
