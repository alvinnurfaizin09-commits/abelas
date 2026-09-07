import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import crypto from "crypto";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = readDb();
    const session = db.attendance_sessions.find((s) => s.id === id);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak ditemukan" },
        { status: 404 }
      );
    }

    const now = new Date().getTime();
    const expireTime = new Date(session.expires_at).getTime();
    const remainingSeconds = Math.max(0, Math.floor((expireTime - now) / 1000));
    const isExpired = remainingSeconds <= 0;

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        remainingSeconds,
        isExpired,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: "Gagal mengambil sesi: " + (err as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body; // 'extend_5_min' | 'regenerate_token' | 'close'

    const db = readDb();
    const session = db.attendance_sessions.find((s) => s.id === id);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak ditemukan" },
        { status: 404 }
      );
    }

    const now = new Date();

    if (action === "extend_5_min") {
      const currentExpire = new Date(session.expires_at).getTime();
      const baseTime = Math.max(now.getTime(), currentExpire);
      const newExpire = new Date(baseTime + 5 * 60 * 1000);
      session.expires_at = newExpire.toISOString();
      session.duration_minutes += 5;
      session.status = "active";
    } else if (action === "regenerate_token") {
      session.qr_token = "sec_" + crypto.randomUUID().replace(/-/g, "");
      // Also ensure at least 5 minutes remaining
      const newExpire = new Date(now.getTime() + 5 * 60 * 1000);
      session.expires_at = newExpire.toISOString();
      session.status = "active";
    } else if (action === "close") {
      session.status = "closed";
    }

    writeDb(db);

    const remainingSeconds = Math.max(
      0,
      Math.floor((new Date(session.expires_at).getTime() - now.getTime()) / 1000)
    );

    return NextResponse.json({
      success: true,
      message: "Sesi berhasil diperbarui",
      session: {
        ...session,
        remainingSeconds,
        isExpired: remainingSeconds <= 0,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui sesi: " + (err as Error).message },
      { status: 500 }
    );
  }
}
