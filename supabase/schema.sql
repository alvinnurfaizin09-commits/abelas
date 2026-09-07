-- ==============================================================================
-- SKEMA DATABASE SUPABASE (POSTGRESQL) UNTUK APLIKASI PRESENSI "ABELAS"
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. TABEL KELAS (classes)
CREATE TABLE IF NOT EXISTS classes (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  academic_year VARCHAR DEFAULT '2026/2027',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL PENGGUNA: GURU & SISWA (users)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('admin', 'student')),
  class_id VARCHAR REFERENCES classes(id) ON DELETE SET NULL,
  student_number VARCHAR NOT NULL,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL SESI PRESENSI QR (attendance_sessions)
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id VARCHAR PRIMARY KEY,
  class_id VARCHAR REFERENCES classes(id) ON DELETE CASCADE,
  subject VARCHAR NOT NULL,
  date VARCHAR NOT NULL,
  start_time VARCHAR NOT NULL,
  end_time VARCHAR NOT NULL,
  duration_minutes INTEGER DEFAULT 5,
  qr_token VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'expired', 'closed')),
  created_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL CATATAN PRESENSI (attendance_records)
CREATE TABLE IF NOT EXISTS attendance_records (
  id VARCHAR PRIMARY KEY,
  session_id VARCHAR REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  student_name VARCHAR NOT NULL,
  class_id VARCHAR,
  class_name VARCHAR,
  date VARCHAR NOT NULL,
  time VARCHAR NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('hadir', 'terlambat', 'izin', 'sakit', 'alpha')),
  notes TEXT,
  is_extra_day BOOLEAN DEFAULT FALSE,
  token_used VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_student_session UNIQUE (session_id, student_id)
);

-- 5. TABEL PENGATURAN SISTEM (system_settings)
CREATE TABLE IF NOT EXISTS system_settings (
  id VARCHAR PRIMARY KEY DEFAULT 'default',
  school_name VARCHAR NOT NULL DEFAULT 'SMK / SMA Negeri - Sistem Presensi Digital',
  allow_extra_days BOOLEAN DEFAULT TRUE,
  extra_days JSONB DEFAULT '["Sabtu", "Minggu"]'::jsonb,
  specific_extra_dates JSONB DEFAULT '[]'::jsonb,
  start_time VARCHAR DEFAULT '07:00',
  late_threshold_time VARCHAR DEFAULT '07:30',
  auto_refresh_qr_seconds INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk performa query cepat
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_number ON users(student_number);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);

-- ==============================================================================
-- KEAMANAN (Row-Level Security / RLS)
-- Mengizinkan akses baca & tulis melalui Anon Key API
-- ==============================================================================
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Allow public insert classes" ON classes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update classes" ON classes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete classes" ON classes FOR DELETE USING (true);

CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete users" ON users FOR DELETE USING (true);

CREATE POLICY "Allow public read sessions" ON attendance_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert sessions" ON attendance_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update sessions" ON attendance_sessions FOR UPDATE USING (true);

CREATE POLICY "Allow public read attendance" ON attendance_records FOR SELECT USING (true);
CREATE POLICY "Allow public insert attendance" ON attendance_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update attendance" ON attendance_records FOR UPDATE USING (true);
CREATE POLICY "Allow public delete attendance" ON attendance_records FOR DELETE USING (true);

CREATE POLICY "Allow public read settings" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Allow public update settings" ON system_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public insert settings" ON system_settings FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- AKTIFKAN SUPABASE REALTIME (Untuk Update Live Layar Presensi Guru)
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_sessions;
