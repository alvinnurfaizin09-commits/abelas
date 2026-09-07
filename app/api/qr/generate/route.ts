import { NextResponse } from "next/server";
import { readDb, writeDb, QRSessionToken } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { classId } = body;

    if (!classId) {
      return NextResponse.json(
        { success: false, error: "Kelas harus dipilih" },
        { status: 400 }
      );
    }

    const db = readDb();
    const targetClass = db.classes.find((c) => c.id === classId);

    if (!targetClass) {
      return NextResponse.json(
        { success: false, error: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    // Generate unique token
    const token = "qr_" + crypto.randomUUID().replace(/-/g, "");
    const now = new Date();
    // Expiration after 30 minutes if unused
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

    const qrTokenData: QRSessionToken = {
      token,
      classId: targetClass.id,
      className: targetClass.name,
      createdAt: now.toISOString(),
      expiresAt,
      isUsed: false,
    };

    // Clean up old used tokens older than 24 hours to keep storage lean
    const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;
    const cleanTokens: Record<string, QRSessionToken> = {};
    for (const [k, v] of Object.entries(db.tokens)) {
      if (new Date(v.createdAt).getTime() > oneDayAgo) {
        cleanTokens[k] = v;
      }
    }
    cleanTokens[token] = qrTokenData;
    db.tokens = cleanTokens;

    writeDb(db);

    // Payload formatted as standard QR scan payload
    const qrPayload = JSON.stringify({
      app: "ABSENSI_APP",
      token,
      classId: targetClass.id,
      className: targetClass.name,
      createdAt: now.toISOString(),
    });

    return NextResponse.json({
      success: true,
      token,
      qrPayload,
      className: targetClass.name,
      classId: targetClass.id,
      createdAt: qrTokenData.createdAt,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: "Gagal membuat QR: " + (err as Error).message },
      { status: 500 }
    );
  }
}
