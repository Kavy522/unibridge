import type {
  AcademicYear,
  ArchiveJob,
  AttendanceRecord,
  AttendanceRules,
  Batch,
  CalendarEvent,
  Faculty,
  FacultyBatchAssignment,
  HodBatchScope,
  MentorAssignment,
  NotificationPreference,
  Phase,
  PromotionDraft,
  PromotionHistory,
  RefreshTokenRecord,
  ResultRecord,
  Semester,
  SessionInfo,
  Student,
  StudentEnrollment,
  Subject,
  University,
  Activity,
} from "../types/domain.js";

interface Store {
  universities: University[];
  academicYears: AcademicYear[];
  faculties: Faculty[];
  semesters: Semester[];
  phases: Phase[];
  batches: Batch[];
  students: Student[];
  studentEnrollments: StudentEnrollment[];
  subjects: Subject[];
  facultyBatchAssignments: FacultyBatchAssignment[];
  hodBatchScopes: HodBatchScope[];
  results: ResultRecord[];
  attendanceRecords: AttendanceRecord[];
  mentorAssignments: MentorAssignment[];
  activities: Activity[];
  calendarEvents: CalendarEvent[];
  notificationPreferences: Record<string, NotificationPreference[]>;
  sessions: SessionInfo[];
  attendanceRules: AttendanceRules;
  archiveJobs: ArchiveJob[];
  promotionDrafts: PromotionDraft[];
  promotionHistory: PromotionHistory[];
  refreshTokens: RefreshTokenRecord[];
  timetableSlots: Array<{
    id: string;
    facultyId: string;
    semesterId: string;
    batchId: string;
    subjectId: string;
    dayOfWeek: number;
    slotStart: string;
    slotEnd: string;
    room: string;
  }>;
  attendanceLectureRecords: Array<{
    id: string;
    facultyId: string;
    subjectId: string;
    batchId: string;
    lectureDate: string;
    enrollmentId: string;
    isPresent: boolean;
    remarks?: string;
    isLocked: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  notes: Array<{
    id: string;
    facultyId: string;
    subjectId: string;
    title: string;
    description: string | null;
    fileUrl: string;
    mimeType: string;
    fileSizeKb: number;
    aiSummary: string | null;
    aiStatus: "QUEUED" | "PROCESSING" | "COMPLETE" | "FAILED";
    aiJobId: string | null;
    visibleToBatchIds: string[];
    createdAt: string;
    deletedAt?: string | null;
  }>;
  noteFlashcards: Array<{
    id: string;
    noteId: string;
    question: string;
    answer: string;
    order: number;
  }>;
  quizzes: Array<{
    id: string;
    facultyId: string;
    subjectId: string;
    semesterId: string;
    title: string;
    description: string | null;
    timeLimitMins: number;
    dueDate: string | null;
    isAiGenerated: boolean;
    isPublished: boolean;
    publishedAt: string | null;
    createdAt: string;
    deletedAt?: string | null;
  }>;
  quizQuestions: Array<{
    id: string;
    quizId: string;
    text: string;
    options: Array<{ id: string; text: string }>;
    correctOption: string;
    explanation: string | null;
    order: number;
  }>;
  quizAttempts: Array<{
    id: string;
    quizId: string;
    studentId: string;
    score: number;
    submittedAt: string;
    answers: Array<{
      questionId: string;
      selectedOption: string;
    }>;
  }>;
  announcements: Array<{
    id: string;
    universityId: string;
    facultyId: string;
    title: string;
    body: string;
    scope: "BATCH" | "ALL" | "YEAR_LEVEL";
    scopeValue: string | null;
    isRead?: boolean;
    createdAt: string;
    updatedAt?: string;
    deletedAt?: string | null;
  }>;
  chatMessages: Array<{
    id: string;
    mentorAssignmentId: string;
    senderRole: "FACULTY" | "STUDENT";
    senderName: string;
    content: string;
    isRead: boolean;
    sentAt: string;
  }>;
  aiJobs: Array<{
    id: string;
    type: "NOTE" | "QUIZ" | "STUDY_PLAN";
    status: "QUEUED" | "PROCESSING" | "COMPLETE" | "FAILED";
    refId: string | null;
    createdAt: string;
  }>;
  selfNotes: Array<{
    id: string;
    studentId: string;
    subjectId: string | null;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  }>;
  announcementReads: Array<{
    announcementId: string;
    studentId: string;
    readAt: string;
  }>;
  aiConversations: Array<{
    id: string;
    studentId: string;
    subjectId: string | null;
    createdAt: string;
    updatedAt: string;
    messages: Array<{
      role: "user" | "assistant";
      content: string;
      timestamp: string;
    }>;
  }>;
  studyPlans: Array<{
    studentId: string;
    semesterId: string;
    plan: Array<{
      date: string;
      sessions: Array<{
        subjectCode: string;
        topic: string;
        durationMins: number;
        priority: "HIGH" | "MEDIUM" | "LOW";
        isCompleted: boolean;
      }>;
    }>;
    aiGenerated: boolean;
    generatedAt: string | null;
  }>;
}

export const store: Store = {
  universities: [
    {
      id: "univ_lju_01",
      name: "LJ University",
      slug: "lju",
      website: "https://ljku.edu.in",
      contactEmail: "admin@ljku.edu.in",
      address: "Nr. Sarkhej-Gandhinagar Hwy, Ahmedabad, Gujarat 382210",
      branches: ["IT", "CSE", "CE", "AIML", "RAI"],
      branchDetails: [
        { code: "IT", name: "Information Technology" },
        { code: "CSE", name: "Computer Science Engineering" },
        { code: "CE", name: "Computer Engineering" },
        { code: "AIML", name: "AI & ML" },
        { code: "RAI", name: "Robotics & AI" },
      ],
      academicYearPattern: "JULY_APRIL",
      plan: "PRO",
    },
  ],
  academicYears: [
    {
      id: "ay_2526",
      universityId: "univ_lju_01",
      label: "2025-26",
      startDate: "2025-07-01",
      endDate: "2026-04-30",
      status: "READY",
    },
    {
      id: "ay_2627",
      universityId: "univ_lju_01",
      label: "2026-27",
      startDate: "2026-07-01",
      endDate: "2027-04-30",
      status: "ACTIVE",
    },
    {
      id: "ay_2728",
      universityId: "univ_lju_01",
      label: "2027-28",
      startDate: "2027-07-01",
      endDate: "2028-04-30",
      status: "DRAFT",
    },
  ],
  faculties: [
    {
      id: "super_admin_001",
      universityId: "univ_lju_01",
      name: "System Admin",
      email: "admin@lju.edu.in",
      department: "Administration",
      employeeId: "ADMIN001",
      isHod: false,
      isActive: true,
      phone: "9999999999",
      mentorCode: null,
      profilePhotoUrl: null,
      passwordHash: "AdminPass123",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  semesters: [
    {
      id: "sem_1",
      universityId: "univ_lju_01",
      number: 1,
      label: "Semester 1",
      academicYearId: "ay_2526",
      isActive: false,
      yearLevel: "FY",
      status: "COMPLETE",
      startDate: "2025-07-01",
      endDate: "2025-10-30",
    },
    {
      id: "sem_2",
      universityId: "univ_lju_01",
      number: 2,
      label: "Semester 2",
      academicYearId: "ay_2526",
      isActive: false,
      yearLevel: "FY",
      status: "COMPLETE",
      startDate: "2025-11-15",
      endDate: "2026-04-15",
    },
    {
      id: "sem_3",
      universityId: "univ_lju_01",
      number: 3,
      label: "Semester 3",
      academicYearId: "ay_2627",
      isActive: true,
      yearLevel: "SY",
      status: "ACTIVE",
      startDate: "2026-07-01",
      endDate: "2026-10-15",
    },
    {
      id: "sem_4",
      universityId: "univ_lju_01",
      number: 4,
      label: "Semester 4",
      academicYearId: "ay_2627",
      isActive: false,
      yearLevel: "SY",
      status: "UPCOMING",
      startDate: "2026-11-01",
      endDate: "2027-04-15",
    },
    {
      id: "sem_5",
      universityId: "univ_lju_01",
      number: 5,
      label: "Semester 5",
      academicYearId: "ay_2728",
      isActive: false,
      yearLevel: "TY",
      status: "UPCOMING",
      startDate: "2027-07-01",
      endDate: "2027-10-15",
    },
  ],
  phases: [
    {
      id: "ph_t1",
      semesterId: "sem_3",
      label: "T1",
      number: 1,
      isActive: false,
      isComplete: false,
      startDate: "2026-07-01",
      endDate: "2026-07-20",
      examDate: "2026-07-25",
    },
    {
      id: "ph_t2",
      semesterId: "sem_3",
      label: "T2",
      number: 2,
      isActive: true,
      isComplete: false,
      startDate: "2026-07-26",
      endDate: "2026-08-20",
      examDate: "2026-08-25",
    },
    {
      id: "ph_t3",
      semesterId: "sem_3",
      label: "T3",
      number: 3,
      isActive: false,
      isComplete: false,
      startDate: "2026-08-26",
      endDate: "2026-09-20",
      examDate: "2026-09-25",
    },
    {
      id: "ph_t4",
      semesterId: "sem_3",
      label: "T4",
      number: 4,
      isActive: false,
      isComplete: false,
      startDate: "2026-09-26",
      endDate: "2026-10-15",
      examDate: "2026-10-20",
    },
  ],
  batches: [
    { id: "batch_a1", universityId: "univ_lju_01", code: "A1", yearLevel: "FY", academicYearId: "ay_2526", branch: "IT" },
    { id: "batch_b1", universityId: "univ_lju_01", code: "B1", yearLevel: "SY", academicYearId: "ay_2627", branch: "IT" },
    { id: "batch_b3", universityId: "univ_lju_01", code: "B3", yearLevel: "SY", academicYearId: "ay_2627", branch: "IT" },
    { id: "batch_c2", universityId: "univ_lju_01", code: "C2", yearLevel: "SY", academicYearId: "ay_2627", branch: "IT" },
    { id: "batch_d1", universityId: "univ_lju_01", code: "D1", yearLevel: "SY", academicYearId: "ay_2627", branch: "IT" },
    { id: "batch_g1", universityId: "univ_lju_01", code: "G1", yearLevel: "TY", academicYearId: "ay_2728", branch: "IT" },
    { id: "batch_g2", universityId: "univ_lju_01", code: "G2", yearLevel: "TY", academicYearId: "ay_2728", branch: "IT" },
  ],
  students: [],
  studentEnrollments: [],
  subjects: [],
  facultyBatchAssignments: [],
  hodBatchScopes: [],
  results: [],
  attendanceRecords: [],
  mentorAssignments: [],
  activities: [],
  calendarEvents: [],
  notificationPreferences: {},
  sessions: [],
  attendanceRules: {
    minThresholdPct: 75,
    warningThresholdPct: 80,
    autoNotifyMentor: true,
    autoLockAfterDays: 7,
  },
  archiveJobs: [],
  promotionDrafts: [],
  promotionHistory: [],
  refreshTokens: [],
  timetableSlots: [],
  attendanceLectureRecords: [],
  notes: [],
  noteFlashcards: [],
  quizzes: [],
  quizQuestions: [],
  quizAttempts: [],
  announcements: [],
  chatMessages: [],
  aiJobs: [],
  selfNotes: [],
  announcementReads: [],
  aiConversations: [],
  studyPlans: [],
};
