// ponytail: one-shot seed for HOD demo. Idempotent-ish — reruns skip existing named rows.
import prisma from "../src/config/prisma.js";

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const FIRST_NAMES = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Rohan", "Ishan", "Kabir", "Reyansh", "Krishna", "Ananya", "Diya", "Aanya", "Aadhya", "Saanvi", "Pari", "Kiara", "Myra", "Anika", "Sara", "Kavy", "Meera", "Priya", "Rhea", "Ishaan", "Neel", "Yash", "Dhruv", "Arya", "Riya"];
const LAST_NAMES = ["Patel", "Shah", "Mehta", "Joshi", "Trivedi", "Desai", "Kapadia", "Amin", "Bhatt", "Raval", "Vyas", "Modi", "Thakkar", "Parekh", "Doshi", "Panchal"];
const SUBJECTS = [
  { code: "COA", name: "Computer Organization & Architecture", credits: 4 },
  { code: "DM", name: "Discrete Mathematics", credits: 4 },
  { code: "TOC", name: "Theory of Computation", credits: 4 },
  { code: "FSD-2", name: "Full Stack Development 2", credits: 3 },
  { code: "FCSP-2", name: "Foundation of CS Practical 2", credits: 2 },
];

async function main() {
  const uni = await prisma.university.findFirst();
  if (!uni) throw new Error("No university — run bootstrap first.");
  const hod = await prisma.faculty.findFirst({ where: { isHod: true, isActive: true } });
  if (!hod) throw new Error("No HOD found.");
  console.log(`Seeding for ${uni.slug} · HOD ${hod.name} (${hod.email})`);

  // ── Academic year + semester ─────────────────────────────
  let year = await prisma.academicYear.findFirst({ where: { universityId: uni.id, label: "2026-27" } });
  if (!year) {
    year = await prisma.academicYear.create({
      data: { universityId: uni.id, label: "2026-27", status: "ACTIVE", startDate: new Date("2026-07-01"), endDate: new Date("2027-04-30") },
    });
    console.log("  + academic year 2026-27");
  } else if (year.status !== "ACTIVE") {
    await prisma.academicYear.update({ where: { id: year.id }, data: { status: "ACTIVE" } });
  }
  // Ensure only one active year
  await prisma.academicYear.updateMany({ where: { universityId: uni.id, id: { not: year.id }, status: "ACTIVE" }, data: { status: "ARCHIVED" } });

  let sem = await prisma.semester.findFirst({ where: { academicYearId: year.id, number: 3 } });
  if (!sem) {
    sem = await prisma.semester.create({
      data: {
        universityId: uni.id, academicYearId: year.id,
        number: 3, label: "Semester 3", yearLevel: "SY", status: "ACTIVE",
        startDate: new Date("2026-07-15"), endDate: new Date("2026-12-15"), phaseCount: 4,
      },
    });
    console.log("  + Semester 3");
  } else if (sem.status !== "ACTIVE") {
    await prisma.semester.update({ where: { id: sem.id }, data: { status: "ACTIVE" } });
  }
  await prisma.semester.updateMany({ where: { universityId: uni.id, id: { not: sem.id }, status: "ACTIVE" }, data: { status: "UPCOMING" } });

  // ── Phases ───────────────────────────────────────────────
  const phasesData = [
    { number: 1, label: "T1", startDate: "2026-07-15", endDate: "2026-08-30", examDate: "2026-09-05", isComplete: true },
    { number: 2, label: "T2", startDate: "2026-09-06", endDate: "2026-10-20", examDate: "2026-10-25", isComplete: true },
    { number: 3, label: "T3", startDate: "2026-10-26", endDate: "2026-11-30", examDate: "2026-12-05", isComplete: false },
    { number: 4, label: "T4", startDate: "2026-12-01", endDate: "2026-12-15", examDate: "2026-12-20", isComplete: false },
  ];
  const phases: Record<string, string> = {};
  for (const p of phasesData) {
    const existing = await prisma.phase.findUnique({ where: { semesterId_number: { semesterId: sem.id, number: p.number } } });
    const ph = existing ?? await prisma.phase.create({
      data: { semesterId: sem.id, number: p.number, label: p.label, startDate: new Date(p.startDate), endDate: new Date(p.endDate), examDate: new Date(p.examDate), isComplete: p.isComplete },
    });
    phases[p.label] = ph.id;
  }
  console.log(`  ✓ 4 phases`);

  // ── Batches (C2, B1 assigned to HOD) ─────────────────────
  const batchCodes = ["C2", "B1"];
  const batches: { id: string; code: string }[] = [];
  for (const code of batchCodes) {
    const existing = await prisma.batch.findFirst({ where: { academicYearId: year.id, code } });
    const b = existing ?? await prisma.batch.create({
      data: { universityId: uni.id, academicYearId: year.id, code, yearLevel: "SY" },
    });
    batches.push({ id: b.id, code });
    // HOD scope
    await prisma.hodBatchScope.upsert({
      where: { batchId: b.id },
      update: {},
      create: { facultyId: hod.id, batchId: b.id, semesterId: sem.id, academicYearId: year.id },
    });
  }
  console.log(`  ✓ 2 batches assigned to HOD scope`);

  // ── Subjects ─────────────────────────────────────────────
  const subjectIds: Record<string, string> = {};
  for (const s of SUBJECTS) {
    const existing = await prisma.subject.findFirst({ where: { semesterId: sem.id, code: s.code, deletedAt: null } });
    const subj = existing ?? await prisma.subject.create({
      data: { universityId: uni.id, semesterId: sem.id, code: s.code, name: s.name, credits: s.credits, type: s.code.includes("P") ? "PRACTICAL" : "THEORY" },
    });
    subjectIds[s.code] = subj.id;
  }
  console.log(`  ✓ ${SUBJECTS.length} subjects`);

  // ── Additional faculty ──────────────────────────────────
  const facultyProfiles = [
    { employeeId: "EMP202", name: "Dr. Mehul Rana", email: "mehul.rana@lju.edu.in", mentorCode: "MRN" },
    { employeeId: "EMP203", name: "Dr. Priyanka Shah", email: "priyanka.shah@lju.edu.in", mentorCode: "PKS" },
    { employeeId: "EMP204", name: "Prof. Vikram Bhatt", email: "vikram.bhatt@lju.edu.in", mentorCode: "VKB" },
    { employeeId: "EMP205", name: "Prof. Neha Trivedi", email: "neha.trivedi@lju.edu.in", mentorCode: "NHT" },
    { employeeId: "EMP206", name: "Dr. Anil Desai", email: "anil.desai@lju.edu.in", mentorCode: "AND" },
  ];
  const faculty: { id: string; employeeId: string; mentorCode: string }[] = [];
  for (const f of facultyProfiles) {
    const existing = await prisma.faculty.findFirst({ where: { employeeId: f.employeeId, deletedAt: null } });
    const fac = existing ?? await prisma.faculty.create({
      data: {
        universityId: uni.id, employeeId: f.employeeId, name: f.name, email: f.email,
        department: "IT", isHod: false, isActive: true, mentorCode: f.mentorCode,
        passwordHash: `${f.employeeId}@123`,
      },
    });
    faculty.push({ id: fac.id, employeeId: f.employeeId, mentorCode: f.mentorCode });
  }
  console.log(`  ✓ ${faculty.length} additional faculty`);

  // ── Faculty subject assignments ─────────────────────────
  const subjectFaculty: Record<string, string> = {
    COA: faculty[0].id,
    DM: faculty[1].id,
    TOC: faculty[2].id,
    "FSD-2": faculty[3].id,
    "FCSP-2": faculty[4].id,
  };
  for (const [code, facId] of Object.entries(subjectFaculty)) {
    for (const b of batches) {
      const exists = await prisma.facultyBatchAssignment.findFirst({
        where: { facultyId: facId, batchId: b.id, subjectId: subjectIds[code], semesterId: sem.id },
      });
      if (!exists) {
        await prisma.facultyBatchAssignment.create({
          data: { facultyId: facId, batchId: b.id, subjectId: subjectIds[code], semesterId: sem.id },
        });
      }
    }
  }
  console.log(`  ✓ ${Object.keys(subjectFaculty).length * batches.length} faculty-subject-batch assignments`);

  // ── Students + enrollments ──────────────────────────────
  const existingCount = await prisma.studentEnrollment.count({ where: { semesterId: sem.id, batchId: { in: batches.map((b) => b.id) } } });
  if (existingCount >= 40) {
    console.log(`  ⏭  ${existingCount} students already enrolled — skipping student seed`);
  } else {
    const perBatch = 25;
    for (let bi = 0; bi < batches.length; bi++) {
      const b = batches[bi];
      for (let i = 1; i <= perBatch; i++) {
        const idx = bi * perBatch + i;
        const first = pick(FIRST_NAMES);
        const last = pick(LAST_NAMES);
        const enrollmentNo = `2400217021${(400 + idx).toString().padStart(4, "0")}`;
        const rollNo = `IT-25-${(bi * perBatch + i).toString().padStart(3, "0")}`;
        const email = `${first.toLowerCase()}.${last.toLowerCase()}${idx}@lju.edu.in`;
        let student = await prisma.student.findFirst({ where: { enrollmentNo, deletedAt: null } });
        if (!student) {
          student = await prisma.student.create({
            data: {
              universityId: uni.id, enrollmentNo, name: `${first} ${last}`, email,
              branch: "IT", admissionYear: 2024, isActive: true,
              passwordHash: `${enrollmentNo}@123`,
            },
          });
        }
        const existingEnr = await prisma.studentEnrollment.findFirst({ where: { studentId: student.id, semesterId: sem.id } });
        if (!existingEnr) {
          await prisma.studentEnrollment.create({
            data: { studentId: student.id, semesterId: sem.id, batchId: b.id, rollNo, yearLevel: "SY", isCurrent: true },
          });
        }
      }
    }
    console.log(`  ✓ ${batches.length * perBatch} students enrolled`);
  }

  const enrollments = await prisma.studentEnrollment.findMany({
    where: { semesterId: sem.id, batchId: { in: batches.map((b) => b.id) } },
    include: { student: true },
  });

  // ── Attendance records — 15 lectures per subject per batch ─
  const existingAttendance = await prisma.attendanceRecord.count();
  if (existingAttendance === 0) {
    for (const b of batches) {
      const batchEnrollments = enrollments.filter((e) => e.batchId === b.id);
      for (const [code, subjectId] of Object.entries(subjectIds)) {
        const facId = subjectFaculty[code];
        for (let day = 0; day < 15; day++) {
          const lectureDate = new Date(2026, 8, 1 + day); // Sept 2026
          for (const enr of batchEnrollments) {
            // 65-95% attendance per student, bias toward high
            const targetPct = rand(65, 95);
            const isPresent = rand(1, 100) <= targetPct;
            await prisma.attendanceRecord.create({
              data: { enrollmentId: enr.id, subjectId, facultyId: facId, lectureDate, isPresent, isLocked: day < 5 },
            });
          }
        }
      }
    }
    console.log(`  ✓ attendance records seeded`);
  } else {
    console.log(`  ⏭  ${existingAttendance} attendance records exist`);
  }

  // ── Results for T1 + T2 (published) ─────────────────────
  const existingResults = await prisma.result.count();
  if (existingResults === 0) {
    for (const phaseLabel of ["T1", "T2"]) {
      const phaseId = phases[phaseLabel];
      for (const [code, subjectId] of Object.entries(subjectIds)) {
        for (const enr of enrollments) {
          const marks = rand(30, 95);
          const grade = marks >= 90 ? "A+" : marks >= 80 ? "A" : marks >= 70 ? "B" : marks >= 60 ? "C" : marks >= 50 ? "D" : "F";
          await prisma.result.create({
            data: {
              enrollmentId: enr.id, phaseId, subjectId, marksObtained: marks, maxMarks: 100,
              grade, isPublished: true, publishedAt: new Date(), uploadedById: hod.id,
            },
          });
        }
      }
    }
    console.log(`  ✓ results seeded (T1 + T2 published)`);
  }

  // ── Mentor assignments — split evenly ────────────────────
  const existingMentors = await prisma.mentorAssignment.count({ where: { semesterId: sem.id } });
  if (existingMentors < enrollments.length - 5) {
    for (let i = 0; i < enrollments.length; i++) {
      const enr = enrollments[i];
      // Leave last 4 unassigned
      if (i >= enrollments.length - 4) break;
      const mentor = faculty[i % faculty.length];
      const exists = await prisma.mentorAssignment.findFirst({ where: { studentId: enr.studentId, semesterId: sem.id } });
      if (!exists) {
        await prisma.mentorAssignment.create({
          data: { facultyId: mentor.id, studentId: enr.studentId, semesterId: sem.id, mentorCode: mentor.mentorCode },
        });
      }
    }
    console.log(`  ✓ mentor assignments seeded (4 left unassigned for demo)`);
  }

  // ── Calendar events ──────────────────────────────────────
  if (await prisma.calendarEvent.count() === 0) {
    const events = [
      { title: "T3 Phase Start", startDate: "2026-10-26", endDate: "2026-10-26", eventType: "PHASE" as const },
      { title: "Diwali Holidays", startDate: "2026-11-01", endDate: "2026-11-05", eventType: "HOLIDAY" as const },
      { title: "Tech Fest 2026", startDate: "2026-11-15", endDate: "2026-11-17", eventType: "CULTURAL" as const },
      { title: "T3 Exams", startDate: "2026-12-05", endDate: "2026-12-10", eventType: "EXAM" as const },
      { title: "Winter Break", startDate: "2026-12-20", endDate: "2027-01-03", eventType: "HOLIDAY" as const },
      { title: "Semester Ends", startDate: "2026-12-15", endDate: "2026-12-15", eventType: "OTHER" as const },
    ];
    for (const ev of events) {
      await prisma.calendarEvent.create({
        data: { universityId: uni.id, semesterId: sem.id, title: ev.title, startDate: new Date(ev.startDate), endDate: new Date(ev.endDate), eventType: ev.eventType, visibleTo: "ALL", createdById: hod.id },
      });
    }
    console.log(`  ✓ ${events.length} calendar events`);
  }

  // ── Activity log ─────────────────────────────────────────
  if (await prisma.activityLog.count() === 0) {
    const activities: { type: any; title: string; description: string; daysAgo: number }[] = [
      { type: "SEMESTER_CREATED", title: "Semester 3 activated", description: "SY semester 3 marked as active.", daysAgo: 60 },
      { type: "BATCH_CREATED", title: "Batches C2 & B1 created", description: "2 new SY batches assigned to HOD.", daysAgo: 59 },
      { type: "STUDENT_CSV_UPLOAD", title: "50 students enrolled", description: "Bulk enrollment via CSV.", daysAgo: 45 },
      { type: "FACULTY_CSV_UPLOAD", title: "5 faculty added", description: "IT department faculty onboarded.", daysAgo: 40 },
      { type: "MENTOR_ASSIGNED", title: "Mentor assignments completed", description: "46 students assigned to mentors.", daysAgo: 30 },
      { type: "RESULT_UPLOAD", title: "T1 results published", description: "T1 results for 5 subjects published.", daysAgo: 20 },
      { type: "RESULT_UPLOAD", title: "T2 results published", description: "T2 results for 5 subjects published.", daysAgo: 5 },
      { type: "CALENDAR_EVENT_ADDED", title: "Diwali holidays added", description: "5-day holiday scheduled.", daysAgo: 3 },
    ];
    for (const a of activities) {
      await prisma.activityLog.create({
        data: {
          universityId: uni.id, facultyId: hod.id, type: a.type, title: a.title, description: a.description,
          createdAt: new Date(Date.now() - a.daysAgo * 86400_000),
        },
      });
    }
    console.log(`  ✓ ${activities.length} activity log entries`);
  }

  // ── Attendance rules ─────────────────────────────────────
  await prisma.attendanceRules.upsert({
    where: { universityId: uni.id },
    update: {},
    create: { universityId: uni.id, minThresholdPct: 75, warningThresholdPct: 80, autoNotifyMentor: true, autoLockAfterDays: 7 },
  });

  console.log("\n✓ Seed complete.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
