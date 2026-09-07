import { NextResponse } from "next/server";
import { readDb, writeDb, AttendanceSession } from "@/lib/db";
import { saveSession } from "@/lib/dataService";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const sessionId = searchParams.get("id");

    const db = readDb();
    let sessions = db.attendance_sessions;

    if (sessionId) {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) {
        return NextResponse.json(
          { success: false, error: "Sesi tidak ditemukan" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, session });
    }

    if (activeOnly) {
      const now = new Date().getTime();
      sessions = sessions.filter(
        (s) => s.status === "active" && new Date(s.expires_at).getTime() > now
      );
    }

    return NextResponse.json({
      success: true,
      sessions: sessions.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: "Gagal mengambil sesi: " + (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subject, date, start_time, duration_minutes = 5, class_id = "cls-xid" } = body;

    if (!subject) {
      return NextResponse.json(
        { success: false, error: "Mata pelajaran wajib diisi" },
        { status: 400 }
      );
    }

    const db = readDb();

    // Format date string YYYYMMDD
    const todayStr = date || new Date().toISOString().split("T")[0];
    const dateFormatted = todayStr.replace(/-/g, "");

    // Count existing sessions for today to create ATT-YYYYMMDD-XXX
    const todaySessions = db.attendance_sessions.filter((s) => s.date === todayStr);
    const seq = String(todaySessions.length + 1).padStart(3, "0");
    const sessionId = `ATT-${dateFormatted}-${seq}`;

    // Calculate end time
    const [startH, startM] = (start_time || "07:00").split(":").map(Number);
    const endMinutesTotal = startH * 60 + startM + Number(duration_minutes);
    const endH = String(Math.floor(endMinutesTotal / 60) % 24).padStart(2, "0");
    const endM = String(endMinutesTotal % 60).padStart(2, "0");
    const endTime = `${endH}:${endM}`;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + Number(duration_minutes) * 60 * 1000).toISOString();
    const qrToken = "sec_" + crypto.randomUUID().replace(/-/g, "");

    const newSession: AttendanceSession = {
      id: sessionId,
      class_id,
      subject: subject.trim(),
      date: todayStr,
      start_time: start_time || "07:00",
      end_time: endTime,
      duration_minutes: Number(duration_minutes),
      qr_token: qrToken,
      status: "active",
      created_by: "usr-admin-1",
      created_at: now.toISOString(),
      expires_at: expiresAt,
    };

    // Close any previous active session
    db.attendance_sessions.forEach((s) => {
      if (s.status === "active") s.status = "closed";
    });

    db.attendance_sessions.unshift(newSession);
    writeDb(db);

    await saveSession(newSession);

    return NextResponse.json({
      success: true,
      message: "Sesi absensi berhasil dibuat",
      session: newSession,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: "Gagal membuat sesi: " + (err as Error).message },
      { status: 500 }
    );
  }
}
