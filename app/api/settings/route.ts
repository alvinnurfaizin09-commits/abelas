import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/dataService";
import { SystemSettings } from "@/lib/db";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({
    success: true,
    settings,
  });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const current = await getSettings();

    const updatedSettings: SystemSettings = {
      schoolName: body.schoolName !== undefined ? String(body.schoolName) : current.schoolName,
      allowExtraDays: body.allowExtraDays !== undefined ? Boolean(body.allowExtraDays) : current.allowExtraDays,
      extraDays: Array.isArray(body.extraDays) ? body.extraDays : current.extraDays,
      specificExtraDates: Array.isArray(body.specificExtraDates) ? body.specificExtraDates : current.specificExtraDates,
      startTime: body.startTime || current.startTime,
      lateThresholdTime: body.lateThresholdTime || current.lateThresholdTime,
      autoRefreshQrSeconds: typeof body.autoRefreshQrSeconds === "number" ? body.autoRefreshQrSeconds : current.autoRefreshQrSeconds,
    };

    await updateSettings(updatedSettings);

    return NextResponse.json({
      success: true,
      message: "Pengaturan berhasil diperbarui",
      settings: updatedSettings,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui pengaturan: " + (err as Error).message },
      { status: 500 }
    );
  }
}
