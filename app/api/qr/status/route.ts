import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token query parameter is required" },
        { status: 400 }
      );
    }

    const db = readDb();
    const tokenData = db.tokens[token];

    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: "Token tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      token: tokenData.token,
      isUsed: tokenData.isUsed,
      usedBy: tokenData.usedBy || null,
      classId: tokenData.classId,
      className: tokenData.className,
      createdAt: tokenData.createdAt,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: "Gagal mengecek status token: " + (err as Error).message },
      { status: 500 }
    );
  }
}
