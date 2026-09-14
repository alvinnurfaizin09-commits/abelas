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

function seedDefaultData(): DatabaseSchema {
  return {
    users: [],
    classes: [
      { id: "cls-xia", name: "XI-A", academic_year: "2026/2027", description: "Kelas Unggulan IPA 1" },
      { id: "cls-xib", name: "XI-B", academic_year: "2026/2027", description: "Kelas Unggulan IPA 2" },
      { id: "cls-xid", name: "XI-D", academic_year: "2026/2027", description: "Kelas Reguler IPA" },
    ],
    attendance_sessions: [],
    attendance_records: [],
    tokens: {},
    attendance: [],
    settings: {
      schoolName: "SMA / SMK Negeri - Sistem Presensi Digital",
      allowExtraDays: true,
      extraDays: ["Sabtu"],
      specificExtraDates: [],
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
      users: Array.isArray(parsed.users) ? parsed.users : [],
      classes: Array.isArray(parsed.classes) && parsed.classes.length > 0 ? parsed.classes : defaults.classes,
      attendance_sessions: Array.isArray(parsed.attendance_sessions) ? parsed.attendance_sessions : [],
      attendance_records: Array.isArray(parsed.attendance_records) ? parsed.attendance_records : [],
      tokens: parsed.tokens || {},
      attendance: parsed.attendance || [],
      settings: parsed.settings || defaults.settings,
    };
  } catch (error) {
    console.error("Error reading database file, re-seeding clean data:", error);
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
