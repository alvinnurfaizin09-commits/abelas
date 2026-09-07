// Comprehensive End-to-End Test for QR Code Attendance System
const BASE_URL = "http://localhost:3000";

async function runE2ETests() {
  console.log("\n=======================================================");
  console.log("   TEST E2E: SISTEM ABSENSI KELAS QR CODE SEKALI PAKAI");
  console.log("=======================================================\n");

  try {
    // 1. Test Admin Menambahkan Nama Kelas Sendiri
    console.log("[TEST 1] Admin menambahkan nama kelas baru...");
    const addClassRes = await fetch(`${BASE_URL}/api/classes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "XII Rekayasa Perangkat Lunak 3 (Kelas Khusus)",
        description: "Laboratorium Software & AI - Proyek Alvin",
      }),
    });
    const addClassData = await addClassRes.json();
    console.log("-> Status:", addClassRes.status, "| Sukses:", addClassData.success);
    console.log("-> Kelas Ditambahkan:", addClassData.classItem?.name, `(ID: ${addClassData.classItem?.id})`);
    if (!addClassData.success) throw new Error("Gagal menambah kelas");
    const classId = addClassData.classItem.id;

    // 2. Test Admin Men-generate Token QR 1-Time Use
    console.log("\n[TEST 2] Admin men-generate QR Code Sekali Pakai...");
    const genQRRes = await fetch(`${BASE_URL}/api/qr/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId }),
    });
    const genQRData = await genQRRes.json();
    console.log("-> Status:", genQRRes.status, "| Token Dihasilkan:", genQRData.token);
    console.log("-> Kelas:", genQRData.className);
    if (!genQRData.success) throw new Error("Gagal generate QR");
    const qrToken = genQRData.token;

    // 3. Test Siswa Pertama (Alvin) Men-scan QR
    console.log("\n[TEST 3] Siswa 1 (Alvin Pratama) menyecan kode QR untuk pertama kali...");
    const scan1Res = await fetch(`${BASE_URL}/api/qr/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: qrToken,
        studentName: "Alvin Pratama",
        studentId: "20261001",
        classId,
      }),
    });
    const scan1Data = await scan1Res.json();
    console.log("-> Status HTTP:", scan1Res.status);
    console.log("-> Pesan:", scan1Data.message);
    console.log("-> Tanggal Tercatat:", scan1Data.formattedDate);
    console.log("-> Jam Scan:", scan1Data.time, "WIB");
    console.log("-> Hari Tambahan?:", scan1Data.isExtraDay ? "YA" : "TIDAK");
    if (scan1Res.status !== 200 || !scan1Data.success) {
      throw new Error("Scan pertama gagal: " + scan1Data.error);
    }

    // 4. Test KRITIS: Siswa Kedua (Budi) Mencoba Scan QR yang SAMA (Aturan 1 QR = 1 Kali Scan)
    console.log("\n[TEST 4 - KRITIS] Siswa 2 (Budi Santoso) mencoba scan QR yang SAMA...");
    const scan2Res = await fetch(`${BASE_URL}/api/qr/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: qrToken,
        studentName: "Budi Santoso",
        studentId: "20261002",
        classId,
      }),
    });
    const scan2Data = await scan2Res.json();
    console.log("-> Status HTTP:", scan2Res.status, "(Diharapkan 409 Conflict)");
    console.log("-> Respon Ditolak:", scan2Data.error);
    if (scan2Res.status === 409 && scan2Data.isAlreadyUsed) {
      console.log("✅ BERHASIL! Sistem secara ketat MENOLAK scan kedua karena QR sudah pernah digunakan!");
    } else {
      throw new Error("Gagal! QR yang sudah digunakan tidak tertolak dengan benar.");
    }

    // 5. Test Cek Status Token di Admin Polling
    console.log("\n[TEST 5] Admin memeriksa status token QR via /api/qr/status...");
    const statusRes = await fetch(`${BASE_URL}/api/qr/status?token=${qrToken}`);
    const statusData = await statusRes.json();
    console.log("-> Token isUsed:", statusData.isUsed);
    console.log("-> Discan oleh:", statusData.usedBy?.studentName, "pada", statusData.usedBy?.time, "WIB");
    if (!statusData.isUsed) throw new Error("Status token belum terupdate menjadi isUsed: true");

    // 6. Test Ambil Data Rekap Absensi
    console.log("\n[TEST 6] Mengambil data rekapitulasi kehadiran...");
    const attRes = await fetch(`${BASE_URL}/api/attendance`);
    const attData = await attRes.json();
    console.log(`-> Total riwayat tersimpan: ${attData.records.length} data`);
    const lastRecord = attData.records[0];
    console.log(`-> Data teratas: ${lastRecord.studentName} | Kelas: ${lastRecord.className} | Waktu: ${lastRecord.time} WIB`);

    // 7. Test Pengaturan Hari Tambahan (Weekend/Khusus)
    console.log("\n[TEST 7] Memperbarui pengaturan Hari Tambahan (Sabtu & Minggu)...");
    const setRes = await fetch(`${BASE_URL}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        allowExtraDays: true,
        extraDays: ["Sabtu", "Minggu"],
        specificExtraDates: ["2026-09-06", "2026-09-12"],
        startTime: "07:00",
        lateThresholdTime: "07:30",
        schoolName: "SMK / SMA Negeri - Sistem Presensi Digital Modern",
      }),
    });
    const setData = await setRes.json();
    console.log("-> Status Update Pengaturan:", setData.success, "| Hari Tambahan Aktif:", setData.settings.allowExtraDays);

    console.log("\n=======================================================");
    console.log("   🎉 SEMUA TEST E2E BERHASIL DENGAN SEMPURNA! 🎉");
    console.log("=======================================================\n");
  } catch (err) {
    console.error("❌ TEST GAGAL:", err.message);
    process.exit(1);
  }
}

runE2ETests();
