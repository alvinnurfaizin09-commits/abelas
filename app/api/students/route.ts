import { NextResponse } from "next/server";
import {
  getUsers,
  getAttendanceRecords,
  getActiveSession,
  getSessionById,
  createStudent,
  deleteStudent,
  getClasses,
  MAX_STUDENTS_PER_CLASS,
} from "@/lib/dataService";
import { readDb } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("id");
    const classId = searchParams.get("class_id") || "cls-xid";
    const sessionId = searchParams.get("session_id");

    const allUsers = await getUsers();
    const allRecords = await getAttendanceRecords();
    const allClasses = await getClasses();
    const fallbackDb = readDb();
    const allSessions = fallbackDb.attendance_sessions;

    if (studentId) {
      const student = allUsers.find((u) => u.id === studentId && u.role === "student");
      if (!student) {
        return NextResponse.json(
          { success: false, error: "Siswa tidak ditemukan" },
          { status: 404 }
        );
      }

      // Calculate stats for this student across all historical sessions
      const studentRecords = allRecords.filter((r) => r.student_id === studentId);
      const hadirCount = studentRecords.filter((r) => r.status === "hadir").length;
      const terlambatCount = studentRecords.filter((r) => r.status === "terlambat").length;
      const izinCount = studentRecords.filter((r) => r.status === "izin").length;
      const sakitCount = studentRecords.filter((r) => r.status === "sakit").length;
      const alphaCount = studentRecords.filter((r) => r.status === "alpha").length;

      const totalSessions = allSessions.length;
      // Formula: (Hadir + Terlambat) / TotalSessions
      const attendanceRate =
        totalSessions > 0
          ? Math.min(100, Math.round(((hadirCount + terlambatCount) / totalSessions) * 100))
          : 100;

      // History enriched with session subject and date
      const history = studentRecords.map((r) => {
        const sess = allSessions.find((s) => s.id === r.session_id);
        return {
          id: r.id,
          subject: sess?.subject || "Mata Pelajaran",
          date: sess?.date || r.date || "-",
          status: r.status,
          scanTime: r.time || r.scan_time,
          notes: r.notes,
        };
      });

      const studentClass = allClasses.find((c) => c.id === student.class_id);

      return NextResponse.json({
        success: true,
        student: {
          id: student.id,
          name: student.name,
          studentNumber: student.student_number,
          email: student.email,
          classId: student.class_id || null,
          className: studentClass ? studentClass.name : null,
          stats: {
            hadir: hadirCount,
            terlambat: terlambatCount,
            izin: izinCount,
            sakit: sakitCount,
            alpha: alphaCount,
            attendanceRate: attendanceRate,
          },
          history,
        },
      });
    }

    // List students for class with their status for current / specified session
    const isAllClasses = classId === "all";
    const students = isAllClasses
      ? allUsers.filter((u) => u.role === "student")
      : allUsers.filter((u) => u.role === "student" && u.class_id === classId);

    const currentClass = allClasses.find((c) => c.id === classId) || (allClasses.length > 0 ? allClasses[0] : null);

    const activeSession = sessionId
      ? await getSessionById(sessionId)
      : await getActiveSession(isAllClasses ? undefined : classId);

    const studentListWithStatus = students.map((student) => {
      const record = activeSession
        ? allRecords.find(
            (r) => r.session_id === activeSession.id && r.student_id === student.id
          )
        : null;

      const studentClass = allClasses.find((c) => c.id === student.class_id);

      return {
        id: student.id,
        name: student.name,
        studentNumber: student.student_number,
        email: student.email,
        class_id: student.class_id,
        className: studentClass?.name || "Kelas",
        status: record ? record.status : "belum_hadir",
        scanTime: record ? (record.time || record.scan_time) : "—",
        notes: record?.notes || "",
      };
    });

    const hadirTotal = studentListWithStatus.filter(
      (s) => s.status === "hadir" || s.status === "terlambat"
    ).length;
    const belumHadirTotal = students.length - hadirTotal;
    const rate = students.length > 0 ? Math.round((hadirTotal / students.length) * 100) : 0;

    return NextResponse.json({
      success: true,
      totalStudents: students.length,
      maxCapacity: MAX_STUDENTS_PER_CLASS,
      capacityLeft: Math.max(0, MAX_STUDENTS_PER_CLASS - students.length),
      isFull: students.length >= MAX_STUDENTS_PER_CLASS,
      currentClass: currentClass,
      classes: allClasses,
      hadirTotal,
      belumHadirTotal,
      attendanceRate: rate,
      students: studentListWithStatus,
      session: activeSession,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data siswa: " + (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, student_number, class_id, password } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Nama lengkap siswa wajib diisi" },
        { status: 400 }
      );
    }
    if (!student_number || typeof student_number !== "string" || !student_number.trim()) {
      return NextResponse.json(
        { success: false, error: "NIS (Nomor Induk Siswa) wajib diisi" },
        { status: 400 }
      );
    }
    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "Email siswa wajib diisi" },
        { status: 400 }
      );
    }
    if (!class_id || typeof class_id !== "string" || !class_id.trim()) {
      return NextResponse.json(
        { success: false, error: "ID Kelas tujuan wajib dipilih" },
        { status: 400 }
      );
    }

    const result = await createStudent({
      name: name.trim(),
      email: email.trim(),
      student_number: student_number.trim(),
      class_id: class_id.trim(),
      password: password?.trim() || "siswa123",
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Siswa berhasil didaftarkan ke kelas",
        student: result.student,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: "Gagal memproses data: " + (err as Error).message },
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
        { success: false, error: "ID siswa wajib disertakan" },
        { status: 400 }
      );
    }

    const result = await deleteStudent(id);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Gagal menghapus siswa" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Siswa berhasil dihapus dari sistem",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: "Gagal menghapus siswa: " + (err as Error).message },
      { status: 500 }
    );
  }
}

