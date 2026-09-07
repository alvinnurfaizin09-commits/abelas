import { NextResponse } from "next/server";
import { registerUser } from "@/lib/dataService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, student_number, password, role, class_id, firebase_uid } = body;

    // Validate presence of required fields
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Nama lengkap wajib diisi." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "Email wajib diisi." },
        { status: 400 }
      );
    }

    if (!student_number || typeof student_number !== "string" || !student_number.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: role === "admin" ? "NIP wajib diisi." : "NIS wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const assignedRole = role === "admin" ? "admin" : "student";

    const result = await registerUser({
      name,
      email,
      student_number,
      password,
      role: assignedRole,
      class_id: null,
      firebase_uid,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Return safe user without password
    const { password_hash, ...safeUser } = result.user!;

    return NextResponse.json(
      {
        success: true,
        message: "Akun berhasil didaftarkan! Silakan masuk dengan akun Anda.",
        user: safeUser,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: "Gagal memproses pendaftaran: " + (err as Error).message },
      { status: 500 }
    );
  }
}
