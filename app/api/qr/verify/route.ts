import { NextResponse } from "next/server";
import {
  readDb,
  writeDb,
  getIndonesianDayName,
  getIndonesianFormattedDate,
  AttendanceRecord,
} from "@/lib/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { token, studentName, studentId, classId } = body;

    // Support both raw token or JSON string scanned from QR code
    if (typeof token === "string" && token.startsWith("{")) {
      try {
        const parsed = JSON.parse(token);
        if (parsed.token) {
          token = parsed.token;
          if (!classId && parsed.classId) classId = parsed.classId;
        }
      } catch {
        // ignore parse error, use raw token
      }
    }

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, error: "Kode QR tidak valid atau tidak terbaca." },
        { status: 400 }
      );
    }

    if (!studentName || !studentId) {
      return NextResponse.json(
        { success: false, error: "Nama lengkap dan NIS/ID Siswa wajib diisi." },
        { status: 400 }
      );
    }

    studentName = studentName.trim();
    studentId = studentId.trim();

    const db = readDb();
    const tokenData = db.tokens[token];

    // 1. Check if token exists
    if (!tokenData) {
      return NextResponse.json(
        {
          success: false,
          error: "QR Code tidak valid atau sudah kadaluarsa dari sistem.",
        },
        { status: 404 }
      );
    }

    // 2. Check if token is already used (1 QR HANYA 1 KALI SCAN)
    if (tokenData.isUsed) {
      const usedByInfo = tokenData.usedBy
        ? `${tokenData.usedBy.studentName} (${tokenData.usedBy.time} WIB)`
        : "pengguna lain";
      return NextResponse.json(
        {
          success: false,
          error: `QR Code ini SUDAH DIGUNAKAN oleh ${usedByInfo}! Sesuai aturan, 1 QR hanya bisa digunakan 1 kali scan. Silakan minta kode QR baru ke Admin.`,
          isAlreadyUsed: true,
        },
        { status: 409 }
      );
    }

    // 3. Check expiration
    const now = new Date();
    if (new Date(tokenData.expiresAt).getTime() < now.getTime()) {
      return NextResponse.json(
        {
          success: false,
          error: "Waktu QR Code telah habis. Minta Admin men-generate QR baru.",
        },
        { status: 400 }
      );
    }

    // 4. Check class match if specified
    const targetClass = db.classes.find((c) => c.id === tokenData.classId);
    const resolvedClassName = targetClass ? targetClass.name : tokenData.className;

    // 5. Date and Day checks
    const dayName = getIndonesianDayName(now);
    const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const isWeekend = dayName === "Sabtu" || dayName === "Minggu";

    // Hari Tambahan check
    let isExtraDay = false;
    if (isWeekend) {
      const settings = db.settings;
      const isDayAllowed =
        settings.allowExtraDays &&
        (settings.extraDays.includes(dayName) ||
          settings.specificExtraDates.includes(dateStr));

      if (!isDayAllowed) {
        return NextResponse.json(
          {
            success: false,
            error: `Hari ini adalah ${dayName} (di luar jadwal Senin-Jumat) dan belum diaktifkan sebagai "Hari Tambahan" oleh Admin. Hubungi Admin untuk mengaktifkan sesi hari ini.`,
          },
          { status: 403 }
        );
      }
      isExtraDay = true;
    }

    // 6. Check if student already attended THIS class TODAY
    const existingAttendance = db.attendance.find(
      (a) =>
        a.date === dateStr &&
        a.classId === tokenData.classId &&
        (a.studentId.toLowerCase() === studentId.toLowerCase() ||
          a.studentName.toLowerCase() === studentName.toLowerCase())
    );

    if (existingAttendance) {
      return NextResponse.json(
        {
          success: false,
          error: `Anda (${studentName}) sudah tercatat hadir untuk kelas ${resolvedClassName} hari ini pada pukul ${existingAttendance.time} WIB.`,
          alreadyAttended: true,
        },
        { status: 409 }
      );
    }

    // 7. Determine status (hadir tepat waktu vs terlambat)
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const currentTimeStr = `${hours}:${minutes}:${seconds}`;

    let status: "hadir" | "terlambat" = "hadir";
    if (db.settings.lateThresholdTime) {
      const [lateH, lateM] = db.settings.lateThresholdTime.split(":").map(Number);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const thresholdMinutes = lateH * 60 + (lateM || 0);
      if (currentMinutes > thresholdMinutes) {
        status = "terlambat";
      }
    }

    // 8. Mark token as USED immediately (consumes the 1-time token)
    tokenData.isUsed = true;
    tokenData.usedBy = {
      studentName,
      studentId,
      timestamp: now.toISOString(),
      time: `${hours}:${minutes}:${seconds}`,
    };
    db.tokens[token] = tokenData;

    // 9. Record Attendance
    const newRecord: AttendanceRecord = {
      id: "att-" + crypto.randomUUID().slice(0, 8),
      studentName,
      studentId,
      classId: tokenData.classId,
      className: resolvedClassName,
      date: dateStr,
      time: currentTimeStr,
      timestamp: now.toISOString(),
      isExtraDay,
      dayName,
      status,
      tokenUsed: token,
    };

    db.attendance.unshift(newRecord);
    writeDb(db);

    return NextResponse.json({
      success: true,
      message: `Presensi berhasil! Selamat datang di kelas ${resolvedClassName}.`,
      record: newRecord,
      formattedDate: getIndonesianFormattedDate(now),
      time: currentTimeStr,
      isExtraDay,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: "Gagal memproses absensi: " + (err as Error).message },
      { status: 500 }
    );
  }
}
