import { NextResponse } from "next/server";
import {
  getAttendanceRecords,
  getUsers,
  getClasses,
  getSessionById,
  getActiveSession,
  addAttendanceRecord,
  updateAttendanceStatus,
  deleteAttendanceRecord,
  getSettings,
  assignStudentToClass,
} from "@/lib/dataService";
import { AttendanceStatus, readDb } from "@/lib/db";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    const studentId = searchParams.get("student_id");

    let records = await getAttendanceRecords();
    const allUsers = await getUsers();
    const fallbackDb = readDb();
    const allSessions = fallbackDb.attendance_sessions;

    if (sessionId) {
      records = records.filter((r) => r.session_id === sessionId);
    }
    if (studentId) {
      records = records.filter((r) => r.student_id === studentId);
    }

    // Attach student and session details
    const populated = records.map((rec) => {
      const student = allUsers.find((u) => u.id === rec.student_id);
      const session = allSessions.find((s) => s.id === rec.session_id);
      return {
        ...rec,
        studentName: rec.studentName || student?.name || "Siswa",
        studentNumber: student?.student_number || "-",
        subject: session?.subject || "Mata Pelajaran",
        sessionDate: session?.date || rec.date || "-",
      };
    });

    return NextResponse.json({
      success: true,
      records: populated,
      allClasses: fallbackDb.classes,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: "Gagal mengambil absensi: " + (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { session_id, token, student_id } = body;

    // Handle scanned string if passed as QR payload URL/JSON
    // Format could be: attendance/session/{session_id}?token={secure_token}
    if (typeof token === "string" && token.includes("session/")) {
      try {
        const parts = token.split("session/")[1];
        const [sessIdPart, queryPart] = parts.split("?");
        if (sessIdPart) session_id = sessIdPart;
        if (queryPart && queryPart.includes("token=")) {
          token = queryPart.split("token=")[1].split("&")[0];
        }
      } catch {
        // use fallback
      }
    }

    if (!session_id || !token || !student_id) {
      return NextResponse.json(
        { success: false, error: "Data sesi, token, dan siswa wajib disertakan" },
        { status: 400 }
      );
    }

    const session = await getSessionById(session_id);
    const allUsers = await getUsers();
    const student = allUsers.find((u) => u.id === student_id);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Sesi absensi tidak ditemukan" },
        { status: 404 }
      );
    }

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Data siswa tidak ditemukan di sistem" },
        { status: 404 }
      );
    }

    // 1. Auto-assign unassigned student to this class, or verify enrollment
    let newlyEnrolled = false;
    const allClasses = await getClasses();
    const targetClass = allClasses.find((c) => c.id === session.class_id);
    const targetClassName = targetClass ? targetClass.name : session.class_id;

    if (!student.class_id || student.class_id === "unassigned") {
      // Student is new and has not chosen a class: auto-assign now!
      const assignResult = await assignStudentToClass(student.id, session.class_id);
      if (!assignResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: assignResult.error || `Gagal bergabung ke Kelas ${targetClassName}.`,
          },
          { status: 400 }
        );
      }
      student.class_id = session.class_id;
      newlyEnrolled = true;
    } else if (student.class_id !== session.class_id) {
      const studentClass = allClasses.find((c) => c.id === student.class_id);
      return NextResponse.json(
        {
          success: false,
          error: `Kamu sudah terdaftar di Kelas ${studentClass?.name || student.class_id}. Kamu tidak dapat melakukan absensi di sesi kelas ${targetClassName}.`,
        },
        { status: 403 }
      );
    }

    // 2. Verify token
    if (session.qr_token !== token) {
      return NextResponse.json(
        {
          success: false,
          error: "QR Code tidak valid atau sudah diganti oleh guru",
        },
        { status: 400 }
      );
    }

    // 3. Verify session active and not expired
    const now = new Date();
    if (session.status !== "active" || new Date(session.expires_at).getTime() < now.getTime()) {
      return NextResponse.json(
        {
          success: false,
          isExpired: true,
          error: "QR Code telah kedaluwarsa. Minta guru untuk memperpanjang sesi.",
        },
        { status: 400 }
      );
    }

    // 4. Format scan time HH:mm
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const scanTimeStr = `${hours}:${minutes}`;

    // 5. Determine auto status based on admin's lateThresholdTime setting
    const settings = await getSettings();
    const lateThreshold = settings.lateThresholdTime || "07:30";
    let autoStatus: AttendanceStatus = "hadir";
    if (scanTimeStr > lateThreshold) {
      autoStatus = "terlambat";
    }

    // 6. Save with atomic duplicate check
    const resolvedClassName = targetClass ? targetClass.name : (session.class_id === "cls-xid" ? "XI-D" : session.class_id);

    const recordResult = await addAttendanceRecord({
      id: "rec-" + crypto.randomUUID().slice(0, 8),
      session_id,
      student_id,
      studentName: student.name,
      classId: session.class_id,
      className: resolvedClassName,
      date: session.date || new Date().toISOString().split("T")[0],
      time: scanTimeStr,
      status: autoStatus,
      tokenUsed: token,
    });

    if (!recordResult.success && recordResult.isDuplicate) {
      return NextResponse.json(
        {
          success: false,
          isDuplicate: true,
          message: "Kamu sudah melakukan absensi",
          data: {
            studentName: student.name,
            scanTime: scanTimeStr,
            subject: session.subject,
            status: autoStatus,
          },
        },
        { status: 409 }
      );
    }

    const statusLabel = autoStatus === "hadir" ? "Hadir" : "Terlambat";
    const statusNote = autoStatus === "hadir" ? "Absensi Berhasil (Tepat Waktu)" : "Absensi Berhasil (Terlambat)";
    const message = newlyEnrolled
      ? `Selamat! Kamu otomatis terdaftar di Kelas ${resolvedClassName}. ${statusNote}.`
      : statusNote;

    return NextResponse.json({
      success: true,
      message,
      newlyEnrolled,
      className: resolvedClassName,
      data: {
        studentName: student.name,
        subject: session.subject,
        className: resolvedClassName,
        scanTime: scanTimeStr,
        status: statusLabel,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: "Gagal memproses absensi: " + (err as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { session_id, student_id, status, notes } = body;

    if (!session_id || !student_id || !status) {
      return NextResponse.json(
        { success: false, error: "session_id, student_id, dan status diperlukan" },
        { status: 400 }
      );
    }

    const validStatuses: AttendanceStatus[] = ["hadir", "terlambat", "izin", "sakit", "alpha"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Status tidak valid" },
        { status: 400 }
      );
    }

    const allRecords = await getAttendanceRecords();
    const existing = allRecords.find((r) => r.session_id === session_id && r.student_id === student_id);

    if (existing) {
      await updateAttendanceStatus(existing.id, status, notes);
    } else {
      const allUsers = await getUsers();
      const student = allUsers.find((u) => u.id === student_id);
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");

      await addAttendanceRecord({
        id: "rec-" + crypto.randomUUID().slice(0, 8),
        session_id,
        student_id,
        studentName: student?.name || "Siswa",
        classId: "cls-xid",
        className: "XI-D",
        date: new Date().toISOString().split("T")[0],
        time: `${hours}:${minutes}`,
        status,
        notes: notes || "",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Status absensi berhasil diperbarui",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: "Gagal mengubah status: " + (err as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID presensi diperlukan" },
        { status: 400 }
      );
    }
    const success = await deleteAttendanceRecord(id);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
