// Test all specifications from the prompt
const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("==================================================================");
  console.log("   TEST SPESIFIKASI DETAIL APLIKASI WEB ABSENSI KELAS QR CODE     ");
  console.log("==================================================================\n");

  try {
    // 1. Test Admin Membuat Sesi Absensi (+ Buat Absensi)
    console.log("[TEST 1] Admin membuat sesi absensi baru (Matematika, 5 menit)...");
    const createRes = await fetch(`${BASE_URL}/api/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Matematika",
        date: "2026-09-06",
        start_time: "07:00",
        duration_minutes: 5,
        class_id: "cls-xid",
      }),
    });
    const createData = await createRes.json();
    console.log("-> Status HTTP:", createRes.status, "| Sukses:", createData.success);
    console.log("-> Session ID:", createData.session?.id);
    console.log("-> Durasi & Expire:", createData.session?.duration_minutes, "menit |", createData.session?.expires_at);
    console.log("-> QR Token:", createData.session?.qr_token);
    if (!createData.success) throw new Error("Gagal membuat sesi");
    const sessionId = createData.session.id;
    const qrToken = createData.session.qr_token;

    // 2. Test Get Sesi Detail & Realtime Countdown
    console.log("\n[TEST 2] Mengambil detail sesi & countdown realtime...");
    const sessDetailRes = await fetch(`${BASE_URL}/api/sessions/${sessionId}`);
    const sessDetailData = await sessDetailRes.json();
    console.log("-> Sisa detik countdown:", sessDetailData.session?.remainingSeconds, "detik");
    console.log("-> Status expired:", sessDetailData.session?.isExpired);
    if (sessDetailData.session?.remainingSeconds <= 0) throw new Error("Countdown harus aktif");

    // 3. Test Siswa (std-1002 Andi Nugraha) Scan QR
    console.log("\n[TEST 3] Siswa (Andi Nugraha) melakukan scan QR pertama kali...");
    const scan1Res = await fetch(`${BASE_URL}/api/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        token: qrToken,
        student_id: "std-1002",
      }),
    });
    const scan1Data = await scan1Res.json();
    console.log("-> Status HTTP:", scan1Res.status);
    console.log("-> Pesan:", scan1Data.message);
    console.log("-> Data Absen:", scan1Data.data);
    if (scan1Res.status !== 200 || !scan1Data.success) {
      throw new Error("Scan pertama gagal: " + scan1Data.error);
    }

    // 4. Test KRITIS DUPLICATE ATTENDANCE: Siswa yang sama scan lagi di sesi yang sama
    console.log("\n[TEST 4 - KRITIS] Siswa yang sama (Andi Nugraha) mencoba scan KEDUA KALI di sesi ini...");
    const scan2Res = await fetch(`${BASE_URL}/api/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        token: qrToken,
        student_id: "std-1002",
      }),
    });
    const scan2Data = await scan2Res.json();
    console.log("-> Status HTTP:", scan2Res.status, "(Diharapkan 409 Conflict)");
    console.log("-> isDuplicate:", scan2Data.isDuplicate);
    console.log("-> Pesan:", scan2Data.message);
    console.log("-> Data Terdaftar:", scan2Data.data);
    if (scan2Res.status === 409 && scan2Data.isDuplicate) {
      console.log("✅ BERHASIL! Duplicate attendance dicegah dengan pesan: 'Kamu sudah melakukan absensi'!");
    } else {
      throw new Error("Pencegahan absensi ganda gagal!");
    }

    // 5. Test Admin Perpanjang Sesi 5 Menit ("Perpanjang 5 menit")
    console.log("\n[TEST 5] Admin memperpanjang durasi QR 5 menit...");
    const extRes = await fetch(`${BASE_URL}/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "extend_5_min" }),
    });
    const extData = await extRes.json();
    console.log("-> Durasi baru:", extData.session?.duration_minutes, "menit");
    console.log("-> Sisa detik baru:", extData.session?.remainingSeconds, "detik");
    if (extData.session?.duration_minutes < 10) throw new Error("Durasi gagal diperpanjang");

    // 6. Test Admin Ubah Status Manual (Manual Attendance)
    console.log("\n[TEST 6] Admin mengubah status siswa std-1004 (Citra Nurhaliza) menjadi 'Izin'...");
    const manualRes = await fetch(`${BASE_URL}/api/attendance`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        student_id: "std-1004",
        status: "izin",
        notes: "Izin olimpiade matematika",
      }),
    });
    const manualData = await manualRes.json();
    console.log("-> Status HTTP:", manualRes.status, "| Sukses:", manualData.success);
    if (!manualData.success) throw new Error("Gagal mengubah status manual");

    // 7. Test Data Siswa & Profil (Stats 43 Hadir, Rate 91%)
    console.log("\n[TEST 7] Memeriksa profil siswa Alvin Nur Faizin...");
    const profileRes = await fetch(`${BASE_URL}/api/students?id=std-1001`);
    const profileData = await profileRes.json();
    console.log("-> Siswa:", profileData.student?.name);
    console.log("-> Kelas:", profileData.student?.className);
    console.log("-> Statistik:", profileData.student?.stats);
    if (!profileData.success) throw new Error("Gagal mengambil data profil siswa");

    console.log("\n==================================================================");
    console.log("   🎉 SEMUA 7 SKENARIO SPESIFIKASI BERHASIL 100%! 🎉            ");
    console.log("==================================================================\n");
  } catch (err) {
    console.error("❌ TEST GAGAL:", err.message);
    process.exit(1);
  }
}

runTests();
