# UniPortal — HOD Scoping Architecture
> Critical correction: Each HOD sees ONLY students/faculty in batches assigned to them.
> This document defines the data model patch, middleware, and all affected endpoints.

---

## The Core Rule

A university has **multiple HODs** — one per batch-group. FY alone has 5 HODs. Each HOD:
- Uploads their own student CSV → students enroll into **their batches only**
- Uploads their own faculty CSV → faculty assigned to **their batches only**
- Sees attendance, results, analytics, mentors **only for their own batches**
- Cannot see or modify data belonging to another HOD's batches

This is enforced at **three layers**:
1. `HodBatchScope` table — links a HOD to the batches they own
2. `hodScope` Express middleware — auto-injects `req.hodBatchIds` on every HOD route
3. Prisma service layer — every query filters `batchId IN (req.hodBatchIds)`

---

## Data Model Changes

### New Table: `HodBatchScope`

```prisma
// Links a HOD (faculty with isHod=true) to the specific batches they own.
// One HOD can own multiple batches. One batch has exactly ONE HOD owner.
model HodBatchScope {
  id         String @id @default(uuid())
  facultyId  String // must be a faculty with isHod = true
  batchId    String @unique  // ONE HOD per batch — enforced at DB level
  semesterId String // scope is per-semester (batches reshuffle each sem)
  createdAt  DateTime @default(now())

  faculty    Faculty  @relation(fields: [facultyId], references: [id])
  batch      Batch    @relation(fields: [batchId], references: [id])
  semester   Semester @relation(fields: [semesterId], references: [id])

  @@unique([facultyId, batchId, semesterId])
  @@map("hod_batch_scopes")
}
```

Add relation back on `Faculty`:
```prisma
model Faculty {
  // ... existing fields ...
  hodBatchScopes HodBatchScope[]
}
```

Add relation back on `Batch`:
```prisma
model Batch {
  // ... existing fields ...
  hodScope HodBatchScope?  // enforces @unique — one HOD per batch
}
```

### Modified: `Student` CSV upload

When HOD uploads `student.csv`, the `batchId` values in the upload **must belong to this HOD's scope**. The API validates this and rejects rows referencing batches not owned by the uploading HOD.

### Modified: `Faculty` CSV upload

When HOD uploads `faculty.csv`, the uploaded faculty are tagged with `uploadedByHodId` and their `FacultyBatchAssignment` rows are restricted to the HOD's owned batches.

---

## `hodScope` Middleware

Lives at `middleware/hodScope.ts`. Runs after `auth.ts` on every `/hod/*` route.

```typescript
// middleware/hodScope.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

export async function hodScope(req: Request, res: Response, next: NextFunction) {
  // req.user is already set by auth middleware
  if (!req.user.isHod) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'HOD role required' } });
  }

  // Fetch the batches this HOD owns for the active semester
  // If semesterId is passed as query param, use it; else use active semester
  const semesterId = req.query.semesterId as string | undefined;

  const scopes = await prisma.hodBatchScope.findMany({
    where: {
      facultyId: req.user.id,
      ...(semesterId ? { semesterId } : {
        semester: { isActive: true }
      })
    },
    select: { batchId: true, semesterId: true, batch: { select: { code: true } } }
  });

  req.hodBatchIds = scopes.map(s => s.batchId);
  req.hodBatchCodes = scopes.map(s => s.batch.code);
  req.hodSemesterIds = [...new Set(scopes.map(s => s.semesterId))];

  // If HOD has no batches assigned, they can still log in but see empty data
  // (not an error — might be a new HOD not yet assigned batches by super-admin)
  next();
}
```

**Mount in `routes/index.ts`:**
```typescript
import { requireAuth } from '../middleware/auth';
import { hodScope } from '../middleware/hodScope';

// Every HOD route gets both middlewares
router.use('/hod', requireAuth, hodScope, hodRouter);
```

**TypeScript declaration extension (`types/express.d.ts`):**
```typescript
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        role: 'FACULTY' | 'STUDENT';
        isHod: boolean;
        universityId: string;
      };
      hodBatchIds: string[];       // injected by hodScope middleware
      hodBatchCodes: string[];     // e.g. ["C2", "B1"]
      hodSemesterIds: string[];
    }
  }
}
```

---

## Who Assigns Batches to a HOD?

**Super-admin** (or a university-level admin panel, not yet built) creates the `HodBatchScope` rows when:
1. A new academic year is created
2. Batches are created and distributed among HODs

This is a **setup step** done once per semester/year, not something any HOD can do themselves. In the short term (before a super-admin UI exists), it is done via a seed/setup endpoint:

### `POST /admin/hod-scope` *(Super-admin only)*
Assign batches to a HOD for a semester.

**Auth required:** Super-admin JWT

**Request Body**
```json
{
  "facultyId": "fac_001",
  "batchIds": ["batch_c2", "batch_b1", "batch_b3"],
  "semesterId": "sem_3"
}
```

**Response `201 Created`**
```json
{
  "assigned": [
    { "hodId": "fac_001", "batchCode": "C2" },
    { "hodId": "fac_001", "batchCode": "B1" },
    { "hodId": "fac_001", "batchCode": "B3" }
  ]
}
```

**Errors:**
- `409 BATCH_ALREADY_HAS_HOD` — another HOD already owns that batch this semester

---

## HOD's Own Scope Info Endpoint

### `GET /hod/my-scope`
Returns the batches and student/faculty counts this HOD manages. Used by sidebar context and all dropdowns.

**Auth required:** HOD

**Response `200 OK`**
```json
{
  "hod": {
    "id": "fac_001",
    "name": "Dr. Rajesh Patel",
    "department": "IT",
    "employeeId": "EMP001"
  },
  "activeSemester": { "id": "sem_3", "label": "Semester 3", "number": 3 },
  "batches": [
    { "id": "batch_c2", "code": "C2", "yearLevel": "SY", "studentCount": 50 },
    { "id": "batch_b1", "code": "B1", "yearLevel": "SY", "studentCount": 48 },
    { "id": "batch_b3", "code": "B3", "yearLevel": "SY", "studentCount": 49 }
  ],
  "totalStudents": 147,
  "totalFaculty": 18
}
```

---

## Affected Endpoints — Full Corrected List

### PAGE 2: Dashboard

#### `GET /hod/dashboard/summary`
**Before:** Counts all students in university.
**After:** Counts only students enrolled in `req.hodBatchIds`.

**Service layer change:**
```typescript
// services/dashboard.service.ts
const totalStudents = await prisma.studentEnrollment.count({
  where: {
    batchId: { in: req.hodBatchIds },
    isCurrent: true,
    student: { universityId: req.user.universityId, isActive: true }
  }
});

const totalFaculty = await prisma.facultyBatchAssignment.groupBy({
  by: ['facultyId'],
  where: { batchId: { in: req.hodBatchIds }, semesterId: { in: req.hodSemesterIds } }
}).then(r => r.length);
```

**Response change:** Counts now reflect HOD's scope, not whole university.
```json
{
  "totalStudents": { "value": 147, "deltaLabel": "+12 this semester" },
  "totalFaculty": { "value": 18, "deltaLabel": "+1 this semester" },
  "activeBatches": { "value": 3, "deltaLabel": "C2, B1, B3" }
}
```

---

#### `GET /hod/dashboard/attendance-trend`
**After:** Only across `req.hodBatchIds`.

**Query Params:** Same. No change to shape.

---

#### `GET /hod/dashboard/at-risk`
**After:** Only students in `req.hodBatchIds`.

---

#### `GET /hod/dashboard/activity-feed`
**After:** Only activities triggered by or affecting this HOD's batches/students.

---

### PAGE 3: Students

#### `GET /hod/students`
**Before:** All students in university.
**After:** Only students with a current enrollment in `req.hodBatchIds`.

**Service layer:**
```typescript
const where = {
  universityId: req.user.universityId,
  isActive: true,
  enrollments: {
    some: {
      batchId: { in: req.hodBatchIds },
      isCurrent: true
    }
  },
  ...(search && {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { enrollmentNo: { contains: search, mode: 'insensitive' } }
    ]
  }),
  ...(branch && { branch }),
};
```

**Additional guard:** `batchId` filter param is validated to only allow values within `req.hodBatchIds`. If a HOD passes a `batchId` they don't own, returns `403 BATCH_NOT_IN_SCOPE`.

---

#### `GET /hod/students/:enrollmentNo`
**After:** Returns `404 NOT_FOUND` if the student's current enrollment is not in `req.hodBatchIds`. HOD cannot "guess" enrollment numbers to access other HODs' students.

**Guard check (added to controller):**
```typescript
const enrollment = await prisma.studentEnrollment.findFirst({
  where: { student: { enrollmentNo }, batchId: { in: req.hodBatchIds }, isCurrent: true }
});
if (!enrollment) throw new NotFoundError('STUDENT_NOT_FOUND');
```

---

#### `GET /hod/students/:enrollmentNo/history`
**After:** Same guard as above. HOD can see the full historical journey of their own student (including semesters before they were under this HOD), but cannot access the endpoint for students who are currently under a different HOD.

*Rationale: A student's history is their data. The HOD who currently owns them can see full history for pastoral/mentoring purposes.*

---

#### `POST /hod/students`
**After:** `batchId` in the request must be within `req.hodBatchIds`. Rejected with `403 BATCH_NOT_IN_SCOPE` otherwise.

---

#### `PUT /hod/students/:enrollmentNo`
**After:** Same ownership guard as GET single.

---

#### `PATCH /hod/students/:enrollmentNo/status`
**After:** Same ownership guard.

---

#### `DELETE /hod/students/:enrollmentNo`
**After:** Same ownership guard.

---

#### `POST /hod/students/csv`
**Critical change:** The `batchId` field in the request **must be within `req.hodBatchIds`**.

**Validation added:**
```typescript
if (!req.hodBatchIds.includes(body.batchId)) {
  throw new ForbiddenError('BATCH_NOT_IN_SCOPE');
}
```

Each row's `enrollment_no` is checked for duplicates globally (still unique per university), but enrollment into the batch is only created for the uploading HOD's batch.

**Request body — no change to shape.** The `batchId` field was already required; it's now also scope-validated.

**Response — no change to shape.**

---

#### `GET /hod/students/export`
**After:** Scoped to `req.hodBatchIds` automatically. HOD can only export their own students.

---

### PAGE 4: Faculty

#### `GET /hod/faculty`
**Before:** All faculty in university.
**After:** Faculty who have at least one `FacultyBatchAssignment` in `req.hodBatchIds`, for the active semester.

**Service layer:**
```typescript
const where = {
  universityId: req.user.universityId,
  isActive: true,
  batchAssignments: {
    some: {
      batchId: { in: req.hodBatchIds },
      semesterId: { in: req.hodSemesterIds }
    }
  },
  isHod: false, // HODs are not listed as "faculty" in their own faculty page
};
```

*Note: A faculty member who teaches batches under multiple HODs appears in both HODs' faculty lists. That is correct — a faculty can be shared across HODs.*

---

#### `GET /hod/faculty/:employeeId`
**After:** Returns `404` if the faculty has no assignment in `req.hodBatchIds` this semester.

---

#### `POST /hod/faculty`
**After:** Creating a faculty member still creates them university-wide (they may later be assigned to other HOD's batches too), but the `FacultyBatchAssignment` rows created on the fly must reference `req.hodBatchIds` only.

---

#### `PUT /hod/faculty/:employeeId`
**After:** Ownership guard — faculty must be in scope.

---

#### `PATCH /hod/faculty/:employeeId/mentor-code`
**After:** Ownership guard.

---

#### `POST /hod/faculty/csv`
**Critical change:** When HOD uploads faculty CSV, each uploaded faculty member's batch assignments must reference only batches in `req.hodBatchIds`.

Faculty CSV columns remain unchanged:
```
employee_id, name, email, department, is_hod, phone
```

**New optional column added:** `batch_codes` — comma-separated batch codes to immediately assign (e.g., `"C2,B1"`). All codes validated against `req.hodBatchCodes`.

**If `batch_codes` not provided:** Faculty is created but unassigned. HOD must then use `POST /hod/faculty/assignments` to assign them.

---

#### `POST /hod/faculty/assignments`
**After:** Both `batchId` and `facultyId` must be in scope.

```typescript
if (!req.hodBatchIds.includes(body.batchId)) {
  throw new ForbiddenError('BATCH_NOT_IN_SCOPE');
}
```

---

#### `DELETE /hod/faculty/assignments/:assignmentId`
**After:** Assignment's `batchId` must be within `req.hodBatchIds`.

---

### PAGE 5: Results

#### `GET /hod/results/upload-context`
**After:** All four dropdowns are pre-filtered to HOD's scope.

```json
{
  "semesters": [{ "id": "sem_3", "label": "Semester 3" }],
  "phases": [...],
  "subjects": [
    // Only subjects whose batch assignments include at least one of req.hodBatchIds
  ],
  "batches": [
    // ONLY the HOD's own batches
    { "id": "batch_c2", "code": "C2" },
    { "id": "batch_b1", "code": "B1" }
  ]
}
```

---

#### `GET /hod/results/students`
**After:** `batchId` query param must be in `req.hodBatchIds`.

---

#### `POST /hod/results/upload`
**After:** `batchId` in form must be in `req.hodBatchIds`. Each `enrollment_no` in the CSV is validated to be enrolled in that batch.

---

#### `POST /hod/results/manual`
**After:** `batchId` validated in scope. Each `enrollmentId` verified to belong to a student in HOD's batch.

---

#### `GET /hod/results/preview`
**After:** `batchId` validated in scope.

---

#### `POST /hod/results/publish`
**After:** `batchId` validated in scope.

---

#### `GET /hod/results/upload-history`
**After:** Only upload history for batches in `req.hodBatchIds`.

---

#### `GET /hod/results/phase-status`
**After:** Phase completion tracked only for HOD's own subjects+batches.

---

#### `PATCH /hod/results/:resultId`
**After:** Result row's `enrollmentId` must resolve to a student in `req.hodBatchIds`.

---

### PAGE 6: Attendance

#### `GET /hod/attendance/summary`
**After:** Calculated only from students in `req.hodBatchIds`.

---

#### `GET /hod/attendance/heatmap`
**After:** `batchId` param validated in scope.

---

#### `GET /hod/attendance/table`
**After:** `batchId` param validated in scope.

---

#### `GET /hod/attendance/by-subject`
**After:** `batchId` param validated in scope.

---

#### `PATCH /hod/attendance/lock`
**After:** `batchId` param validated in scope.

---

#### `PATCH /hod/attendance/lock-all`
**After:** Locks only records in `req.hodBatchIds`. Does not touch other HODs' data.

---

#### `GET /hod/attendance/export`
**After:** Scoped to `req.hodBatchIds`.

---

### PAGE 7: Subjects

#### `GET /hod/subjects`
**After:** Returns subjects assigned to at least one batch in `req.hodBatchIds` for the given semester.

---

#### `POST /hod/subjects`
**After:** `batchIds` array must be a subset of `req.hodBatchIds`.

**Guard:**
```typescript
const invalidBatches = body.batchIds.filter(id => !req.hodBatchIds.includes(id));
if (invalidBatches.length > 0) {
  throw new ForbiddenError('BATCH_NOT_IN_SCOPE');
}
```

---

#### `PUT /hod/subjects/:subjectId`
**After:** Subject must be linked to at least one batch in `req.hodBatchIds`.

---

#### `DELETE /hod/subjects/:subjectId`
**After:** Same scope check.

---

#### `POST /hod/subjects/copy`
**After:** `toSemesterId` and target batches must be within HOD's scope. Cannot copy subjects into another HOD's semester.

---

#### `POST /hod/subjects/:subjectId/pyq`
**After:** Subject must be in HOD's scope.

---

### PAGE 8: Mentorship

#### `GET /hod/mentorship/summary`
**After:** Counts only mentors and students in `req.hodBatchIds`.

---

#### `GET /hod/mentorship/mentors`
**After:** Only faculty mentors assigned to students in `req.hodBatchIds`.

---

#### `GET /hod/mentorship/assignments`
**After:** Only assignments where student's `batchId` is in `req.hodBatchIds`.

---

#### `GET /hod/mentorship/unassigned`
**After:** Only unassigned students in `req.hodBatchIds`.

---

#### `POST /hod/mentorship/assign`
**After:** Student's current `batchId` must be in `req.hodBatchIds`.

```typescript
const enrollment = await prisma.studentEnrollment.findFirst({
  where: { student: { enrollmentNo: body.studentEnrollmentNo }, batchId: { in: req.hodBatchIds }, isCurrent: true }
});
if (!enrollment) throw new ForbiddenError('STUDENT_NOT_IN_SCOPE');
```

---

#### `POST /hod/mentorship/assign/csv`
**After:** All `enrollment_no` values in CSV validated to be in HOD's batches.

---

#### `PATCH /hod/mentorship/reassign`
**After:** Student scope check same as above.

---

#### `POST /hod/mentorship/auto-assign`
**After:** Only distributes students within `req.hodBatchIds` to mentors under this HOD.

---

### PAGE 9: Analytics

All analytics endpoints now automatically scope to `req.hodBatchIds`. No endpoint allows a HOD to request analytics for batches they don't own.

#### `GET /hod/analytics/kpi`
**After:** All KPI figures calculated from `req.hodBatchIds` students only.

#### `GET /hod/analytics/attendance/trend`
**After:** Per-batch trend lines only for owned batches.

#### `GET /hod/analytics/leaderboard`
**After:** Leaderboard is within HOD's batches only — HOD sees the top student in their batches, not across the whole university.

#### `GET /hod/analytics/at-risk`
**After:** At-risk list filtered to HOD's students only.

#### `GET /hod/analytics/year-comparison`
**After:** Comparison is HOD's own batches this year vs HOD's own batches last year.

*This is the natural comparison: "Did my SY-3 batch do better this semester than last semester's SY-3 batch that I also owned?"*

---

### PAGE 10: Promotion

The promotion page has the most important scoping consequence.

#### `GET /hod/promotion/years`
**No change to shape.** Returns all academic years (they're university-wide), needed to pick source/target year.

---

#### `GET /hod/promotion/preview`
**Critical after:** Only shows students in `req.hodBatchIds` as candidates for promotion.

```json
{
  "groups": [
    {
      "yearLevel": "SY",
      "targetYearLevel": "TY",
      "students": [
        // ONLY students currently in C2, B1, B3 — this HOD's batches
      ],
      "availableTargetBatches": [
        // Target batches in the destination year that this HOD will ALSO own
        // Determined by HodBatchScope rows already set up in the target year
      ]
    }
  ]
}
```

**Key rule:** A HOD can only map students FROM their current batches TO target batches that are **also assigned to them** in the destination academic year. The super-admin must have pre-created `HodBatchScope` rows for the new year before the HOD can run promotion.

---

#### `POST /hod/promotion/execute`
**After:** Every `fromEnrollmentId` in the mappings array is validated to belong to a student in `req.hodBatchIds`. Every `toBatchId` is validated to be in `HodBatchScope` for this HOD in the target year.

**Double guard (service layer):**
```typescript
for (const mapping of body.mappings) {
  const fromEnrollment = await prisma.studentEnrollment.findFirst({
    where: { id: mapping.fromEnrollmentId, batchId: { in: req.hodBatchIds } }
  });
  if (!fromEnrollment) throw new ForbiddenError('ENROLLMENT_NOT_IN_SCOPE');

  const toScope = await prisma.hodBatchScope.findFirst({
    where: { facultyId: req.user.id, batchId: mapping.toBatchId, academicYearId: body.toAcademicYearId }
  });
  if (!toScope) throw new ForbiddenError('TARGET_BATCH_NOT_IN_SCOPE');
}
```

---

#### `POST /hod/promotion/mapping/csv`
**After:** All batch codes in CSV validated against HOD's scoped batches in target year.

---

### PAGE 11: Calendar

Calendar events are **university-wide** — all HODs and faculty see the same calendar. A HOD can create, edit, and delete events they created. They cannot delete another HOD's events.

#### `GET /hod/calendar/events`
**No scope change.** All events for the university are visible (holiday, exam dates affect everyone).

#### `POST /hod/calendar/events`
**No scope change.** Any HOD can create university-wide events. Events are tagged with `createdByFacultyId`.

#### `PUT /hod/calendar/events/:eventId`
**Ownership guard added:** HOD can only update events they created.
```typescript
if (event.createdByFacultyId !== req.user.id) {
  throw new ForbiddenError('CANNOT_EDIT_ANOTHER_HODS_EVENT');
}
```

#### `DELETE /hod/calendar/events/:eventId`
**Same ownership guard as PUT.**

---

### PAGE 12: Settings

#### Profile, Security, Notifications tabs
**No scope change.** These are personal to the HOD.

#### University tab
**No scope change.** University-level settings are shared across all HODs of the same university. Any HOD can update university config (name, website, etc.). In a later version, this may be restricted to a "primary HOD" role.

#### Semesters & Years tab
**No scope change.** Academic year and semester creation is university-wide — one year applies to all HODs.

#### Attendance Rules tab
**No scope change.** Attendance thresholds are university-wide policy.

---

## Summary Table: What Each HOD Owns

| Resource | HOD Scope | Cross-HOD Visibility |
|---|---|---|
| Students | Only in their batches | ❌ Never |
| Faculty | Only assigned to their batches | ⚠️ Faculty may appear in multiple HOD's lists if shared |
| Results | Only for their batches | ❌ Never |
| Attendance | Only for their batches | ❌ Never |
| Subjects | Only assigned to their batches | ⚠️ A subject can exist in multiple HOD's batch scope |
| Mentor Assignments | Only their students | ❌ Never |
| Analytics | Only their batches | ❌ Never |
| Promotion | Only their batches → their target batches | ❌ Never |
| Calendar Events | All events (read), own events (write) | ✅ Read only |
| Academic Year / Semester | University-wide | ✅ All |
| University Settings | University-wide | ✅ All |

---

## New Error Codes Added

| HTTP Status | Code | Cause |
|---|---|---|
| 403 | `BATCH_NOT_IN_SCOPE` | HOD tried to access a batch they don't own |
| 403 | `STUDENT_NOT_IN_SCOPE` | Student's current batch is not owned by this HOD |
| 403 | `FACULTY_NOT_IN_SCOPE` | Faculty has no assignment in this HOD's batches |
| 403 | `TARGET_BATCH_NOT_IN_SCOPE` | Promotion target batch not assigned to this HOD in target year |
| 403 | `CANNOT_EDIT_ANOTHER_HODS_EVENT` | HOD tried to edit a calendar event created by another HOD |
| 400 | `HOD_NOT_ASSIGNED_ANY_BATCHES` | HOD has no HodBatchScope rows — contact super-admin |

---

## Prisma Migration

```sql
-- Migration: add_hod_batch_scope

CREATE TABLE "hod_batch_scopes" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "facultyId"   UUID NOT NULL REFERENCES "faculties"("id") ON DELETE CASCADE,
  "batchId"     UUID NOT NULL UNIQUE REFERENCES "batches"("id") ON DELETE CASCADE,
  "semesterId"  UUID NOT NULL REFERENCES "semesters"("id") ON DELETE CASCADE,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT "hod_batch_scopes_facultyId_batchId_semesterId_key"
    UNIQUE ("facultyId", "batchId", "semesterId")
);

-- Index for fast lookup by HOD (used in hodScope middleware on every request)
CREATE INDEX "hod_batch_scopes_facultyId_idx" ON "hod_batch_scopes"("facultyId");

-- Partial index: only allow HOD faculty (enforced at app layer but useful for DB consistency)
CREATE INDEX "hod_batch_scopes_batchId_idx" ON "hod_batch_scopes"("batchId");
```

---

## What Doesn't Change

The `Student`, `Faculty`, `Result`, `AttendanceRecord`, `Subject`, `MentorAssignment`, and `ChatMessage` tables have **no structural changes**. All scoping is achieved purely through query-time filtering using `batchId IN (req.hodBatchIds)`. The data model stays flat and clean — no `hodId` foreign key is added to student or result rows. Ownership is always resolved through the batch.

This means a student who is promoted from HOD-A's batch to HOD-B's batch in a new semester automatically "belongs to" HOD-B from that semester onward — no data migration needed, just the new `StudentEnrollment` row pointing to HOD-B's batch.
