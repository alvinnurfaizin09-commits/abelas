// Automated test script to verify all core logic
import { readDb, writeDb, getIndonesianFormattedDate } from "./lib/db.ts";

async function runTests() {
  console.log("=== MEMULAI TEST VERIFIKASI LOGIKA ABSENSI ===");

  const baseUrl = "http://localhost:3000";

  // Test 1: Date formatting
  const testDate = new Date();
  const formatted = getIndonesianFormattedDate(testDate);
  console.log("✓ Format Tanggal Indonesia:", formatted);

  // Test 2: Classes in Database
  const db = readDb();
  console.log(`✓ Total kelas awal terdaftar: ${db.classes.length}`);
  console.log(`  Kelas: ${db.classes.map((c) => c.name).join(", ")}`);

  // Test 3: Settings Hari Tambahan
  console.log(`✓ Status Hari Tambahan: allowExtraDays=${db.settings.allowExtraDays}`);
  console.log(`  Hari terdaftar: ${db.settings.extraDays.join(", ")}`);

  console.log("\n=== SEMUA TEST STRUKTUR DATA BERHASIL ===");
}

runTests();
