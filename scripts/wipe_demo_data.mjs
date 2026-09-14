import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// 1. Load .env.local
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

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "").trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

async function cleanAll() {
  console.log("=== MEMULAI PEMBERSIHAN DATA DEMO & UJICOBA ===");

  // 1. Clean Supabase if configured
  if (supabaseUrl && supabaseKey) {
    console.log(`Connecting to Supabase at ${supabaseUrl}...`);
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Delete attendance_records
    console.log("1. Menghapus seluruh data absensi (attendance_records)...");
    const { error: errRec, count: countRec } = await supabase
      .from("attendance_records")
      .delete()
      .neq("id", "none_placeholder_never_match");
    if (errRec) {
      console.warn("Peringatan saat hapus records:", errRec.message);
    } else {
      console.log("   ✓ Berhasil mengosongkan attendance_records.");
    }

    // Delete attendance_sessions
    console.log("2. Menghapus seluruh data sesi absensi (attendance_sessions)...");
    const { error: errSess } = await supabase
      .from("attendance_sessions")
      .delete()
      .neq("id", "none_placeholder_never_match");
    if (errSess) {
      console.warn("Peringatan saat hapus sessions:", errSess.message);
    } else {
      console.log("   ✓ Berhasil mengosongkan attendance_sessions.");
    }

    // Delete users
    console.log("3. Menghapus seluruh akun demo & akun percobaan (users)...");
    const { error: errUsers } = await supabase
      .from("users")
      .delete()
      .neq("id", "none_placeholder_never_match");
    if (errUsers) {
      console.warn("Peringatan saat hapus users:", errUsers.message);
    } else {
      console.log("   ✓ Berhasil mengosongkan tabel users.");
    }

    // Verify Supabase classes exist
    console.log("4. Memverifikasi master data kelas...");
    const { data: existingClasses } = await supabase.from("classes").select("id, name");
    console.log("   Daftar kelas aktif:", existingClasses);
  }

  // 2. Clean data/app_db.json
  console.log("5. Mengosongkan data/app_db.json...");
  const appDbPath = path.join(rootDir, "data", "app_db.json");
  const cleanAppDb = {
    users: [],
    classes: [
      { id: "cls-xia", name: "XI-A", academic_year: "2026/2027", description: "Kelas Unggulan IPA 1" },
      { id: "cls-xib", name: "XI-B", academic_year: "2026/2027", description: "Kelas Unggulan IPA 2" },
      { id: "cls-xid", name: "XI-D", academic_year: "2026/2027", description: "Kelas Reguler IPA" }
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
      autoRefreshQrSeconds: 0
    }
  };
  fs.writeFileSync(appDbPath, JSON.stringify(cleanAppDb, null, 2), "utf-8");
  console.log("   ✓ data/app_db.json telah bersih (users: 0, sessions: 0, records: 0).");

  // 3. Clean data/db.json
  console.log("6. Mengosongkan data/db.json...");
  const dbPath = path.join(rootDir, "data", "db.json");
  if (fs.existsSync(dbPath)) {
    const cleanDb = {
      classes: cleanAppDb.classes,
      tokens: {}
    };
    fs.writeFileSync(dbPath, JSON.stringify(cleanDb, null, 2), "utf-8");
    console.log("   ✓ data/db.json telah bersih.");
  }

  console.log("\n=== PEMBERSIHAN SELESAI DENGAN SUKSES! ===");
}

cleanAll().catch(console.error);
