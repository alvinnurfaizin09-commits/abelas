import { NextResponse } from "next/server";
import { getUserByIdentifier } from "@/lib/dataService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password, firebase_uid, email, resolve_email_only } = body;

    // 1. If requesting email lookup for NIS/identifier before Firebase sign-in
    if (resolve_email_only && identifier) {
      const user = await getUserByIdentifier(identifier);
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Akun tidak ditemukan. Periksa kembali email atau NIS/NIP Anda." },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        email: user.email,
        role: user.role,
      });
    }

    // 2. If authenticated via Firebase on client
    if (firebase_uid && email) {
      const user = await getUserByIdentifier(email);
      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: `Akun Firebase (${email}) belum terhubung dengan profil siswa/guru di database sekolah. Hubungi admin.`,
          },
          { status: 404 }
        );
      }

      const { password_hash, ...safeUser } = user;
      return NextResponse.json({
        success: true,
        message: "Login Firebase berhasil",
        user: { ...safeUser, firebase_uid },
      });
    }

    // 3. Standard credential login (fallback & backward compatibility)
    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: "Email/Nomor Induk dan kata sandi wajib diisi" },
        { status: 400 }
      );
    }

    const user = await getUserByIdentifier(identifier);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Akun tidak ditemukan. Periksa kembali email atau NIS/NIP Anda." },
        { status: 404 }
      );
    }

    if (user.password_hash !== password.trim()) {
      return NextResponse.json(
        { success: false, error: "Kata sandi yang Anda masukkan salah." },
        { status: 401 }
      );
    }

    const { password_hash, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      message: "Login berhasil",
      user: safeUser,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: "Gagal memproses login: " + (err as Error).message },
      { status: 500 }
    );
  }
}

