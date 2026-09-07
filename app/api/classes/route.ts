import { NextResponse } from "next/server";
import { getClasses, createClass } from "@/lib/dataService";
import { readDb, writeDb, ClassItem } from "@/lib/db";
import crypto from "crypto";

export async function GET() {
  const classes = await getClasses();
  return NextResponse.json({
    success: true,
    classes,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Nama kelas wajib diisi" },
        { status: 400 }
      );
    }

    const currentClasses = await getClasses();

    // Check duplicate
    const existing = currentClasses.find(
      (c) => c.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Kelas dengan nama tersebut sudah ada" },
        { status: 400 }
      );
    }

    const newClass: ClassItem = {
      id: "cls-" + crypto.randomUUID().slice(0, 8),
      name: name.trim(),
      description: description?.trim() || "",
      createdAt: new Date().toISOString(),
    };

    await createClass(newClass);

    return NextResponse.json({
      success: true,
      message: "Kelas berhasil ditambahkan",
      classItem: newClass,
    });
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
        { success: false, error: "ID kelas diperlukan" },
        { status: 400 }
      );
    }

    const db = readDb();
    const initialLen = db.classes.length;
    db.classes = db.classes.filter((c) => c.id !== id);

    if (db.classes.length === initialLen) {
      return NextResponse.json(
        { success: false, error: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    writeDb(db);

    return NextResponse.json({
      success: true,
      message: "Kelas berhasil dihapus",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: "Gagal menghapus kelas: " + (err as Error).message },
      { status: 500 }
    );
  }
}
