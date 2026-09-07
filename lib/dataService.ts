import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { validateEmailAddress } from "@/lib/emailValidator";
import {
  readDb,
  writeDb,
  User,
  ClassItem,
  AttendanceSession,
  AttendanceRecord,
  AttendanceStatus,
  SystemSettings,
} from "@/lib/db";

// ==========================================
// 1. USERS
// ==========================================
export async function getUsers(): Promise<User[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    const { data, error } = await supabase.from("users").select("*").order("name");
    if (!error && data) {
      return data as User[];
    }
  }
  return readDb().users;
}

export async function getUserByIdentifier(identifier: string): Promise<User | null> {
  const cleanId = identifier.trim().toLowerCase();
  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .or(`email.ilike.${cleanId},student_number.ilike.${cleanId},name.ilike.${cleanId}`)
      .limit(1)
      .maybeSingle();
    if (!error && data) {
      return data as User;
    }
  }

  const db = readDb();
  const user = db.users.find(
    (u) =>
      u.email.toLowerCase() === cleanId ||
      u.student_number.toLowerCase() === cleanId ||
      u.name.toLowerCase() === cleanId
  );
  return user || null;
}

// ==========================================
// 2. CLASSES
// ==========================================
export async function getClasses(): Promise<ClassItem[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    const { data, error } = await supabase.from("classes").select("*").order("name");
    if (!error && data) {
      return data as ClassItem[];
    }
  }
  return readDb().classes;
}

export async function createClass(classItem: ClassItem): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    const { error } = await supabase.from("classes").insert({
      id: classItem.id,
      name: classItem.name,
      academic_year: classItem.academic_year || "2026/2027",
      description: classItem.description || null,
    });
    if (!error) return true;
  }

  const db = readDb();
  db.classes.push(classItem);
  writeDb(db);
  return true;
}

// ==========================================
// 3. SESSIONS
// ==========================================
export async function getActiveSession(classId = "cls-xid"): Promise<AttendanceSession | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    const { data, error } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("class_id", classId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data as AttendanceSession;
    }
  }

  const db = readDb();
  return (
    db.attendance_sessions.find((s) => s.class_id === classId && s.status === "active") ||
    db.attendance_sessions[0] ||
    null
  );
}

export async function getSessionById(sessionId: string): Promise<AttendanceSession | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    const { data, error } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (!error && data) {
      return data as AttendanceSession;
    }
  }

  const db = readDb();
  return db.attendance_sessions.find((s) => s.id === sessionId) || null;
}

export async function saveSession(session: AttendanceSession): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    const { error } = await supabase.from("attendance_sessions").upsert({
      id: session.id,
      class_id: session.class_id,
      subject: session.subject,
      date: session.date,
      start_time: session.start_time,
      end_time: session.end_time,
      duration_minutes: session.duration_minutes,
      qr_token: session.qr_token,
      status: session.status,
      created_by: session.created_by,
      expires_at: session.expires_at,
      created_at: session.created_at,
    });
    if (!error) return true;
  }

  const db = readDb();
  const idx = db.attendance_sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    db.attendance_sessions[idx] = session;
  } else {
    db.attendance_sessions.unshift(session);
  }
  writeDb(db);
  return true;
}

// ==========================================
// 4. ATTENDANCE RECORDS
// ==========================================
export async function getAttendanceRecords(): Promise<AttendanceRecord[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    const { data, error } = await supabase
      .from("attendance_records")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data.map((r) => ({
        id: r.id,
        session_id: r.session_id,
        student_id: r.student_id,
        studentName: r.student_name,
        classId: r.class_id,
        className: r.class_name,
        date: r.date,
        time: r.time,
        status: r.status as AttendanceStatus,
        notes: r.notes || "",
        isExtraDay: r.is_extra_day,
        tokenUsed: r.token_used,
        created_at: r.created_at,
      }));
    }
  }

  return readDb().attendance_records;
}

export async function addAttendanceRecord(record: {
  id: string;
  session_id: string;
  student_id: string;
  studentName: string;
  classId: string;
  className: string;
  date: string;
  time: string;
  status: AttendanceStatus;
  notes?: string;
  isExtraDay?: boolean;
  tokenUsed?: string;
}): Promise<{ success: boolean; isDuplicate?: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    // Check duplicate
    const { data: existing } = await supabase
      .from("attendance_records")
      .select("id, student_name, time, status")
      .eq("session_id", record.session_id)
      .eq("student_id", record.student_id)
      .maybeSingle();

    if (existing) {
      return { success: false, isDuplicate: true };
    }

    const { error } = await supabase.from("attendance_records").insert({
      id: record.id,
      session_id: record.session_id,
      student_id: record.student_id,
      student_name: record.studentName,
      class_id: record.classId,
      class_name: record.className,
      date: record.date,
      time: record.time,
      status: record.status,
      notes: record.notes || null,
      is_extra_day: Boolean(record.isExtraDay),
      token_used: record.tokenUsed || null,
    });

    if (error) {
      if (error.code === "23505") {
        return { success: false, isDuplicate: true };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  // Local JSON fallback
  const db = readDb();
  const duplicate = db.attendance_records.find(
    (r) => r.session_id === record.session_id && r.student_id === record.student_id
  );
  if (duplicate) {
    return { success: false, isDuplicate: true };
  }

  db.attendance_records.push({
    id: record.id,
    session_id: record.session_id,
    student_id: record.student_id,
    studentName: record.studentName,
    classId: record.classId,
    className: record.className,
    date: record.date,
    time: record.time,
    status: record.status,
    notes: record.notes,
    isExtraDay: record.isExtraDay,
    tokenUsed: record.tokenUsed,
    created_at: new Date().toISOString(),
  });
  writeDb(db);
  return { success: true };
}

export async function updateAttendanceStatus(
  id: string,
  status: AttendanceStatus,
  notes?: string
): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    const updates: Record<string, any> = { status };
    if (notes !== undefined) updates.notes = notes;

    const { error } = await supabase
      .from("attendance_records")
      .update(updates)
      .eq("id", id);

    if (!error) return true;
  }

  const db = readDb();
  const rec = db.attendance_records.find((r) => r.id === id);
  if (rec) {
    rec.status = status;
    if (notes !== undefined) rec.notes = notes;
    writeDb(db);
    return true;
  }
  return false;
}

export async function deleteAttendanceRecord(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    const { error } = await supabase.from("attendance_records").delete().eq("id", id);
    if (!error) return true;
  }

  const db = readDb();
  const initialLength = db.attendance_records.length;
  db.attendance_records = db.attendance_records.filter((r) => r.id !== id);
  if (db.attendance_records.length !== initialLength) {
    writeDb(db);
    return true;
  }
  return false;
}

// ==========================================
// 5. SETTINGS
// ==========================================
export async function getSettings(): Promise<SystemSettings> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    const { data, error } = await supabase
      .from("system_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (!error && data) {
      return {
        schoolName: data.school_name,
        allowExtraDays: data.allow_extra_days,
        extraDays: data.extra_days,
        specificExtraDates: data.specific_extra_dates,
        startTime: data.start_time,
        lateThresholdTime: data.late_threshold_time,
        autoRefreshQrSeconds: data.auto_refresh_qr_seconds,
      };
    }
  }

  return readDb().settings;
}

export async function updateSettings(settings: SystemSettings): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    const { error } = await supabase.from("system_settings").upsert({
      id: "default",
      school_name: settings.schoolName,
      allow_extra_days: settings.allowExtraDays,
      extra_days: settings.extraDays,
      specific_extra_dates: settings.specificExtraDates,
      start_time: settings.startTime,
      late_threshold_time: settings.lateThresholdTime,
      auto_refresh_qr_seconds: settings.autoRefreshQrSeconds,
      updated_at: new Date().toISOString(),
    });
    if (!error) return true;
  }

  const db = readDb();
  db.settings = settings;
  writeDb(db);
  return true;
}

// ==========================================
// 6. STUDENT CREATION WITH 40 CAPACITY LIMIT
// ==========================================
export const MAX_STUDENTS_PER_CLASS = 40;

export async function createStudent(student: {
  name: string;
  email: string;
  student_number: string;
  class_id: string;
  password?: string;
}): Promise<{ success: boolean; error?: string; student?: User }> {
  // 1. Check capacity limit for this class
  const allUsers = await getUsers();
  const classStudents = allUsers.filter(
    (u) => u.role === "student" && u.class_id === student.class_id
  );

  if (classStudents.length >= MAX_STUDENTS_PER_CLASS) {
    return {
      success: false,
      error: `Kapasitas kelas penuh! Setiap kelas dibatasi maksimal ${MAX_STUDENTS_PER_CLASS} murid (saat ini sudah ${classStudents.length} murid).`,
    };
  }

  // 2. Check duplicate NIS or Email
  const cleanNumber = student.student_number.trim().toLowerCase();
  const cleanEmail = student.email.trim().toLowerCase();

  const duplicate = allUsers.find(
    (u) =>
      u.student_number.toLowerCase() === cleanNumber ||
      u.email.toLowerCase() === cleanEmail
  );

  if (duplicate) {
    return {
      success: false,
      error: `NIS (${student.student_number}) atau email (${student.email}) sudah digunakan oleh siswa lain.`,
    };
  }

  const newStudent: User = {
    id: `std-${Date.now().toString().slice(-6)}`,
    name: student.name.trim(),
    email: student.email.trim(),
    password_hash: student.password || "siswa123",
    role: "student",
    class_id: student.class_id,
    student_number: student.student_number.trim(),
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    const { error } = await supabase.from("users").insert({
      id: newStudent.id,
      name: newStudent.name,
      email: newStudent.email,
      password_hash: newStudent.password_hash,
      role: newStudent.role,
      class_id: newStudent.class_id,
      student_number: newStudent.student_number,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, student: newStudent };
  }

  const db = readDb();
  db.users.push(newStudent);
  writeDb(db);
  return { success: true, student: newStudent };
}

export async function deleteStudent(studentId: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    const { error } = await supabase.from("users").delete().eq("id", studentId);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  const db = readDb();
  const initialLength = db.users.length;
  db.users = db.users.filter((u) => u.id !== studentId);
  if (db.users.length !== initialLength) {
    writeDb(db);
    return { success: true };
  }
  return { success: false, error: "Siswa tidak ditemukan" };
}

// ==========================================
// 7. USER REGISTRATION WITH STRICT VALIDATION
// ==========================================
export async function registerUser(payload: {
  name: string;
  email: string;
  student_number: string; // NIS or NIP
  password: string;
  role: "student" | "admin";
  class_id?: string | null;
  firebase_uid?: string;
}): Promise<{ success: boolean; error?: string; user?: User }> {
  const cleanEmail = payload.email.trim().toLowerCase();
  const cleanNumber = payload.student_number.trim().toLowerCase();
  const cleanName = payload.name.trim();

  // 1. Name validation
  if (!cleanName || cleanName.length < 3) {
    return { success: false, error: "Nama lengkap minimal 3 karakter." };
  }

  // 2. Strict Email format & domain MX validation
  const emailValidation = await validateEmailAddress(cleanEmail);
  if (!emailValidation.valid) {
    return {
      success: false,
      error: emailValidation.error || "Alamat email tidak valid.",
    };
  }

  // 3. NIS / NIP validation
  if (!cleanNumber || cleanNumber.length < 4) {
    return {
      success: false,
      error: payload.role === "admin" ? "NIP minimal 4 karakter." : "NIS minimal 4 karakter.",
    };
  }

  // 4. Password validation
  if (!payload.password || payload.password.length < 6) {
    return { success: false, error: "Kata sandi minimal 6 karakter demi keamanan akun." };
  }

  const allUsers = await getUsers();

  // 5. Check duplicate email or NIS/NIP
  const existingEmail = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existingEmail) {
    return {
      success: false,
      error: `Email ${payload.email} sudah terdaftar. Silakan gunakan email lain atau langsung masuk.`,
    };
  }

  const existingNumber = allUsers.find(
    (u) => u.student_number.toLowerCase() === cleanNumber
  );
  if (existingNumber) {
    return {
      success: false,
      error: `${payload.role === "admin" ? "NIP" : "NIS"} (${payload.student_number}) sudah terdaftar di sistem.`,
    };
  }

  // 6. For student: Do NOT set class initially (class will be auto-assigned when scanning QR)
  // For admin: class_id is null
  const targetClassId = payload.role === "student" ? null : null;

  const prefix = payload.role === "admin" ? "usr-admin" : "std";
  const newUser: User = {
    id: `${prefix}-${Date.now().toString().slice(-6)}`,
    name: cleanName,
    email: cleanEmail,
    password_hash: payload.password,
    role: payload.role,
    class_id: targetClassId,
    student_number: payload.student_number.trim(),
    firebase_uid: payload.firebase_uid,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    const { error } = await supabase.from("users").insert({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      password_hash: newUser.password_hash,
      role: newUser.role,
      class_id: newUser.class_id,
      student_number: newUser.student_number,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, user: newUser };
  }

  const db = readDb();
  db.users.push(newUser);
  writeDb(db);
  return { success: true, user: newUser };
}

// ==========================================
// 8. AUTO-ENROLL STUDENT TO CLASS ON QR SCAN
// ==========================================
export async function assignStudentToClass(
  studentId: string,
  classId: string
): Promise<{ success: boolean; error?: string; student?: User }> {
  const allUsers = await getUsers();
  const student = allUsers.find((u) => u.id === studentId);
  if (!student) {
    return { success: false, error: "Siswa tidak ditemukan." };
  }

  const allClasses = await getClasses();
  const targetClass = allClasses.find((c) => c.id === classId);
  if (!targetClass) {
    return { success: false, error: `Kelas tidak ditemukan di sistem.` };
  }

  // Check capacity for the target class
  const classStudents = allUsers.filter(
    (u) => u.role === "student" && u.class_id === classId
  );
  if (classStudents.length >= MAX_STUDENTS_PER_CLASS) {
    return {
      success: false,
      error: `Kapasitas Kelas ${targetClass.name} penuh (maksimal ${MAX_STUDENTS_PER_CLASS} murid). Tidak dapat bergabung ke kelas ini.`,
    };
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    const { error } = await supabase
      .from("users")
      .update({ class_id: classId })
      .eq("id", studentId);

    if (error) {
      return { success: false, error: error.message };
    }
  }

  const db = readDb();
  const localStudent = db.users.find((u) => u.id === studentId);
  if (localStudent) {
    localStudent.class_id = classId;
    writeDb(db);
  }

  student.class_id = classId;
  return { success: true, student };
}



