import { NextResponse } from "next/server";
import { validateEmailAddress } from "@/lib/emailValidator";
import { getUsers } from "@/lib/dataService";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { valid: false, error: "Email wajib diisi." },
        { status: 400 }
      );
    }

    // 1. Validate format, domain MX, and disposable status
    const validation = await validateEmailAddress(email);
    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, error: validation.error },
        { status: 400 }
      );
    }

    // 2. Check if already registered in database
    const allUsers = await getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const existing = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return NextResponse.json(
        {
          valid: false,
          error: "Email ini sudah terdaftar di sistem. Silakan masuk dengan akun ini.",
          alreadyRegistered: true,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      message: "Email valid dan siap digunakan.",
      isTrustedDomain: validation.isTrustedDomain,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { valid: false, error: "Gagal memverifikasi email: " + (err as Error).message },
      { status: 500 }
    );
  }
}
