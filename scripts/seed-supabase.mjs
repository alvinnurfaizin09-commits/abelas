import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Load .env.local manually if not present in process.env
function loadEnv() {
  const envPath = path.join(rootDir, ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...vals] = trimmed.split("=");
      if (key && vals.length > 0) {
        const val = vals.join("=").trim().replace(/^["']|["']$/g, "");
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    }
  }
}

loadEnv();

let rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "").trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("your-project-id")) {
  console.error("\n=======================================================");
  console.error("❌ ERROR: Konfigurasi Supabase belum diisi di .env.local!");
  console.error("Pastikan Anda sudah mengisi:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co");
  console.error("  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...");
  console.error("=======================================================\n");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("\n🚀 Memulai migrasi data dari app_db.json ke Supabase...");
  console.log(`📡 URL Target: ${supabaseUrl}\n`);

  const dbPath = path.join(rootDir, "data", "app_db.json");
  if (!fs.existsSync(dbPath)) {
    console.error("❌ Berkas data/app_db.json tidak ditemukan!");
    process.exit(1);
  }

  const raw = fs.readFileSync(dbPath, "utf-8");
  const data = JSON.parse(raw);

  // 1. Upload classes
  console.log(`⏳ Mengunggah ${data.classes?.length || 0} kelas...`);
  if (data.classes && data.classes.length > 0) {
    const { error: errClasses } = await supabase
      .from("classes")
      .upsert(
        data.classes.map((c) => ({
          id: c.id,
          name: c.name,
          academic_year: c.academic_year || "2026/2027",
          description: c.description || null,
        }))
      );
    if (errClasses) {
      console.error("❌ Gagal mengunggah kelas:", errClasses.message);
      console.log("👉 Pastikan Anda sudah menjalankan query di supabase/schema.sql terlebih dahulu di SQL Editor Supabase!");
      process.exit(1);
    }
    console.log("✅ Data kelas berhasil diunggah.");
  }

  // 2. Upload users (Admin + Siswa)
  console.log(`⏳ Mengunggah ${data.users?.length || 0} pengguna (Admin + Siswa)...`);
  if (data.users && data.users.length > 0) {
    const { error: errUsers } = await supabase
      .from("users")
      .upsert(
        data.users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          password_hash: u.password_hash,
          role: u.role,
          class_id: u.class_id,
          student_number: u.student_number,
          avatar: u.avatar || null,
        }))
      );
    if (errUsers) {
      console.error("❌ Gagal mengunggah users:", errUsers.message);
      process.exit(1);
    }
    console.log("✅ Data pengguna berhasil diunggah.");
  }

  // 3. Upload sessions
  console.log(`⏳ Mengunggah ${data.attendance_sessions?.length || 0} sesi presensi...`);
  if (data.attendance_sessions && data.attendance_sessions.length > 0) {
    const { error: errSessions } = await supabase
      .from("attendance_sessions")
      .upsert(
        data.attendance_sessions.map((s) => ({
          id: s.id,
          class_id: s.class_id,
          subject: s.subject,
          date: s.date,
          start_time: s.start_time,
          end_time: s.end_time,
          duration_minutes: s.duration_minutes || 5,
          qr_token: s.qr_token,
          status: s.status || "active",
          created_by: s.created_by,
          expires_at: s.expires_at,
          created_at: s.created_at,
        }))
      );
    if (errSessions) {
      console.error("❌ Gagal mengunggah sesi:", errSessions.message);
      process.exit(1);
    }
    console.log("✅ Data sesi presensi berhasil diunggah.");
  }

  // 4. Upload attendance records
  console.log(`⏳ Mengunggah ${data.attendance_records?.length || 0} catatan presensi...`);
  if (data.attendance_records && data.attendance_records.length > 0) {
    // Process in batches of 100
    const records = data.attendance_records.map((r) => ({
      id: r.id,
      session_id: r.session_id,
      student_id: r.student_id,
      student_name: r.studentName || data.users.find((u) => u.id === r.student_id)?.name || "Siswa",
      class_id: r.classId || "cls-xid",
      class_name: r.className || "XI-D",
      date: r.date || "2026-09-06",
      time: r.time || r.scan_time || "07:02",
      status: r.status,
      notes: r.notes || null,
      is_extra_day: Boolean(r.isExtraDay),
      token_used: r.tokenUsed || null,
      created_at: r.created_at || new Date().toISOString(),
    }));

    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const chunk = records.slice(i, i + batchSize);
      const { error: errRecs } = await supabase
        .from("attendance_records")
        .upsert(chunk);
      if (errRecs) {
        console.error(`❌ Gagal mengunggah catatan presensi batch ${i}:`, errRecs.message);
        break;
      }
    }
    console.log("✅ Catatan presensi berhasil diunggah.");
  }

  // 5. Upload settings
  if (data.settings) {
    console.log("⏳ Mengunggah pengaturan sistem...");
    const { error: errSettings } = await supabase
      .from("system_settings")
      .upsert({
        id: "default",
        school_name: data.settings.schoolName || "SMK / SMA Negeri - Sistem Presensi Digital",
        allow_extra_days: Boolean(data.settings.allowExtraDays),
        extra_days: data.settings.extraDays || ["Sabtu", "Minggu"],
        specific_extra_dates: data.settings.specificExtraDates || [],
        start_time: data.settings.startTime || "07:00",
        late_threshold_time: data.settings.lateThresholdTime || "07:30",
        auto_refresh_qr_seconds: data.settings.autoRefreshQrSeconds || 0,
      });
    if (errSettings) {
      console.error("❌ Gagal mengunggah pengaturan:", errSettings.message);
    } else {
      console.log("✅ Pengaturan sistem berhasil diunggah.");
    }
  }

  console.log("\n🎉 MIGRASI SUKSES 100%! Seluruh data sudah aktif di Supabase Cloud.");
  console.log("===============================================================\n");
}

seed().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
