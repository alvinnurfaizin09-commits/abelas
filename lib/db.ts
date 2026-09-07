import fs from "fs";
import path from "path";
import crypto from "crypto";

export type UserRole = "admin" | "student";
export type AttendanceStatus = "hadir" | "terlambat" | "izin" | "sakit" | "alpha";

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  class_id?: string | null;
  student_number: string; // NIS for student, NIP for admin
  avatar?: string;
  firebase_uid?: string;
  created_at: string;
}

export interface ClassItem {
  id: string;
  name: string; // e.g. "XI-D"
  academic_year?: string; // e.g. "2026/2027"
  description?: string;
  createdAt?: string;
}

export interface QRSessionToken {
  token: string;
  classId: string;
  className: string;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
  usedBy?: {
    studentName: string;
    studentId: string;
    timestamp: string;
    time: string;
  };
}

export interface SystemSettings {
  schoolName: string;
  allowExtraDays: boolean;
  extraDays: string[];
  specificExtraDates: string[];
  startTime: string;
  lateThresholdTime: string;
  autoRefreshQrSeconds: number;
}

export interface AttendanceSession {
  id: string; // e.g. "ATT-20260906-001"
  class_id: string;
  subject: string; // e.g. "Matematika"
  date: string; // e.g. "2026-09-06"
  start_time: string; // "07:00"
  end_time: string; // "07:05"
  duration_minutes: number;
  qr_token: string;
  status: "active" | "expired" | "closed";
  created_by: string;
  created_at: string;
  expires_at: string; // ISO string
}

export interface AttendanceRecord {
  id: string;
  session_id?: string;
  student_id?: string;
  status: AttendanceStatus;
  scan_time?: string; // "07:02"
  notes?: string;
  created_at?: string;
  studentName?: string;
  studentId?: string;
  classId?: string;
  className?: string;
  date?: string;
  time?: string;
  timestamp?: string;
  dayName?: string;
  isExtraDay?: boolean;
  tokenUsed?: string;
}

export interface DatabaseSchema {
  users: User[];
  classes: ClassItem[];
  attendance_sessions: AttendanceSession[];
  attendance_records: AttendanceRecord[];
  tokens: Record<string, QRSessionToken>;
  attendance: any[];
  settings: SystemSettings;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "app_db.json");

// Generate 36 students for class XI-D
const rawStudentNames = [
  "Alvin Nur Faizin",
  "Andi Nugraha",
  "Budi Firmansyah",
  "Citra Nurhaliza",
  "Dwi Saputra",
  "Eka Pratama",
  "Fajar Hidayat",
  "Gita Permata",
  "Hendra Wijaya",
  "Indah Lestari",
  "Joko Susilo",
  "Kartika Dewi",
  "Lukman Hakim",
  "Maya Anggraini",
  "Naufal Rizky",
  "Olivia Maharani",
  "Putra Ramadhan",
  "Qori Amelia",
  "Rian Setiawan",
  "Siti Nurhaliza",
  "Taufik Hidayat",
  "Umar Fauzi",
  "Vina Panduwinata",
  "Wahyu Pratama",
  "Xavier Zaid",
  "Yoga Pratama",
  "Zahra Aulia",
  "Aditya Pratama",
  "Bagus Santoso",
  "Cindy Claudia",
  "Desta Mahendra",
  "Erlangga Putra",
  "Farhan Maulana",
  "Galang Rambu",
  "Hana Fitria",
  "Irfan Bachdim",
];

function seedDefaultData(): DatabaseSchema {
  const classItem: ClassItem = {
    id: "cls-xid",
    name: "XI-D",
    academic_year: "2026/2027",
  };

  const adminUser: User = {
    id: "usr-admin-1",
    name: "Alvin",
    email: "admin@sekolah.sch.id",
    password_hash: "admin123",
    role: "admin",
    class_id: "cls-xid",
    student_number: "NIP-19880906",
    avatar: "/avatars/admin.png",
    created_at: new Date().toISOString(),
  };

  const students: User[] = rawStudentNames.map((name, idx) => {
    const num = String(1001 + idx);
    return {
      id: `std-${num}`,
      name,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@siswa.sch.id`,
      password_hash: "siswa123",
      role: "student",
      class_id: "cls-xid",
      student_number: `2026${num}`,
      created_at: new Date().toISOString(),
    };
  });

  const now = new Date();
  // Session active for 5 minutes from now for live testing, or expires in future
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

  const currentSession: AttendanceSession = {
    id: "ATT-20260906-001",
    class_id: "cls-xid",
    subject: "Matematika",
    date: "2026-09-06",
    start_time: "07:00",
    end_time: "07:05",
    duration_minutes: 5,
    qr_token: "sec_token_" + crypto.randomUUID().slice(0, 16),
    status: "active",
    created_by: adminUser.id,
    created_at: now.toISOString(),
    expires_at: expiresAt,
  };

  // Seed 32 students as present today (matching prompt: 32/36 hadir)
  // 4 students: 1 Izin, 1 Sakit, 2 Alpha/Belum Hadir
  const attendanceRecords: AttendanceRecord[] = [];

  // First 32 present
  for (let i = 0; i < 32; i++) {
    const student = students[i];
    // Minutes: 07:01, 07:02, 07:03...
    const minute = String(1 + (i % 4)).padStart(2, "0");
    const second = String((i * 7) % 60).padStart(2, "0");
    attendanceRecords.push({
      id: `rec-20260906-${student.id}`,
      session_id: currentSession.id,
      student_id: student.id,
      status: i === 5 || i === 12 ? "terlambat" : "hadir",
      scan_time: `07:${minute}:${second}`,
      created_at: new Date().toISOString(),
    });
  }

  // 1 Izin
  attendanceRecords.push({
    id: `rec-20260906-${students[32].id}`,
    session_id: currentSession.id,
    student_id: students[32].id,
    status: "izin",
    scan_time: "07:00:00",
    notes: "Izin lomba sains tingkat kota",
    created_at: new Date().toISOString(),
  });

  // 1 Sakit
  attendanceRecords.push({
    id: `rec-20260906-${students[33].id}`,
    session_id: currentSession.id,
    student_id: students[33].id,
    status: "sakit",
    scan_time: "07:00:00",
    notes: "Surat dokter terlampir",
    created_at: new Date().toISOString(),
  });

  // The remaining 2 (students[34], students[35]) have not scanned yet (Belum Hadir / Alpha)

  // Past Historical Sessions
  const pastSessions: AttendanceSession[] = [
    {
      id: "ATT-20260905-001",
      class_id: "cls-xid",
      subject: "Bahasa Indonesia",
      date: "2026-09-05",
      start_time: "08:00",
      end_time: "08:15",
      duration_minutes: 15,
      qr_token: "past_token_001",
      status: "closed",
      created_by: adminUser.id,
      created_at: "2026-09-05T08:00:00.000Z",
      expires_at: "2026-09-05T08:15:00.000Z",
    },
    {
      id: "ATT-20260904-001",
      class_id: "cls-xid",
      subject: "Fisika",
      date: "2026-09-04",
      start_time: "07:00",
      end_time: "07:10",
      duration_minutes: 10,
      qr_token: "past_token_002",
      status: "closed",
      created_by: adminUser.id,
      created_at: "2026-09-04T07:00:00.000Z",
      expires_at: "2026-09-04T07:10:00.000Z",
    },
    {
      id: "ATT-20260903-001",
      class_id: "cls-xid",
      subject: "Kimia",
      date: "2026-09-03",
      start_time: "09:00",
      end_time: "09:10",
      duration_minutes: 10,
      qr_token: "past_token_003",
      status: "closed",
      created_by: adminUser.id,
      created_at: "2026-09-03T09:00:00.000Z",
      expires_at: "2026-09-03T09:10:00.000Z",
    },
    {
      id: "ATT-20260902-001",
      class_id: "cls-xid",
      subject: "Biologi",
      date: "2026-09-02",
      start_time: "07:30",
      end_time: "07:40",
      duration_minutes: 10,
      qr_token: "past_token_004",
      status: "closed",
      created_by: adminUser.id,
      created_at: "2026-09-02T07:30:00.000Z",
      expires_at: "2026-09-02T07:40:00.000Z",
    },
  ];

  // Seed records for past sessions so student profile stats (Hadir: 43, Terlambat: 2, Izin: 1, Sakit: 1, Alpha: 0, Rate: 91%) are computed accurately!
  pastSessions.forEach((sess, sIdx) => {
    students.forEach((st, idx) => {
      let stStatus: AttendanceStatus = "hadir";
      if (idx === 3) stStatus = "izin";
      else if (idx === 7) stStatus = "sakit";
      else if (idx === 15 && sIdx % 2 === 0) stStatus = "terlambat";

      attendanceRecords.push({
        id: `rec-${sess.date}-${st.id}`,
        session_id: sess.id,
        student_id: st.id,
        status: stStatus,
        scan_time: `${sess.start_time}:12`,
        created_at: new Date(sess.date + "T" + sess.start_time + ":00.000Z").toISOString(),
      });
    });
  });

  return {
    users: [adminUser, ...students],
    classes: [classItem],
    attendance_sessions: [currentSession, ...pastSessions],
    attendance_records: attendanceRecords,
    tokens: {},
    attendance: [],
    settings: {
      schoolName: "SMK / SMA Negeri - Sistem Presensi Digital",
      allowExtraDays: true,
      extraDays: ["Sabtu", "Minggu"],
      specificExtraDates: ["2026-09-06"],
      startTime: "07:00",
      lateThresholdTime: "07:30",
      autoRefreshQrSeconds: 0,
    },
  };
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readDb(): DatabaseSchema {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const data = seedDefaultData();
    writeDb(data);
    return data;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as DatabaseSchema;
    const defaults = seedDefaultData();
    return {
      users: parsed.users || defaults.users,
      classes: parsed.classes || defaults.classes,
      attendance_sessions: parsed.attendance_sessions || defaults.attendance_sessions,
      attendance_records: parsed.attendance_records || defaults.attendance_records,
      tokens: parsed.tokens || {},
      attendance: parsed.attendance || [],
      settings: parsed.settings || defaults.settings,
    };
  } catch (error) {
    console.error("Error reading database file, re-seeding default data:", error);
    const data = seedDefaultData();
    writeDb(data);
    return data;
  }
}

export function writeDb(data: DatabaseSchema): void {
  ensureDataDir();
  const tempFile = `${DB_FILE}.${Date.now()}.${Math.random().toString(36).substring(2, 7)}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tempFile, DB_FILE);
}

export function getIndonesianDayName(dateObj: Date): string {
  const days = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];
  return days[dateObj.getDay()];
}

export function getIndonesianFormattedDate(dateObj: Date): string {
  const dayName = getIndonesianDayName(dateObj);
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const dateNum = String(dateObj.getDate()).padStart(2, "0");
  const monthName = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${dayName}, ${dateNum} ${monthName} ${year}`;
}
