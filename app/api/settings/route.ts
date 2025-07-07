import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-utils"
import { executeQuery } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })
    }

    // Get settings from database
    const settings = (await executeQuery("SELECT * FROM system_settings WHERE id = 1")) as any[]

    if (settings.length === 0) {
      // Create default settings if not exists
      await executeQuery(`
        INSERT INTO system_settings (
          id, auto_notifications, email_notifications, email_host, email_port,
          email_user, email_password, email_from, notification_threshold_critical,
          notification_threshold_reorder, notification_threshold_low, backup_frequency,
          created_at, updated_at
        ) VALUES (
          1, 1, 0, 'smtp.gmail.com', '587', '', '', '', '0', '5', '10', 'daily',
          NOW(), NOW()
        )
      `)

      return NextResponse.json({
        auto_notifications: true,
        email_notifications: false,
        email_host: "smtp.gmail.com",
        email_port: "587",
        email_user: "",
        email_password: "",
        email_from: "",
        notification_threshold_critical: "0",
        notification_threshold_reorder: "5",
        notification_threshold_low: "10",
        backup_frequency: "daily",
      })
    }

    const setting = settings[0]
    return NextResponse.json({
      auto_notifications: Boolean(setting.auto_notifications),
      email_notifications: Boolean(setting.email_notifications),
      email_host: setting.email_host || "smtp.gmail.com",
      email_port: setting.email_port || "587",
      email_user: setting.email_user || "",
      email_password: setting.email_password || "",
      email_from: setting.email_from || "",
      notification_threshold_critical: setting.notification_threshold_critical?.toString() || "0",
      notification_threshold_reorder: setting.notification_threshold_reorder?.toString() || "5",
      notification_threshold_low: setting.notification_threshold_low?.toString() || "10",
      backup_frequency: setting.backup_frequency || "daily",
    })
  } catch (error) {
    console.error("Settings GET error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })
    }

    const body = await request.json()

    // Update settings
    await executeQuery(
      `
      UPDATE system_settings SET
        auto_notifications = ?,
        email_notifications = ?,
        email_host = ?,
        email_port = ?,
        email_user = ?,
        email_password = ?,
        email_from = ?,
        notification_threshold_critical = ?,
        notification_threshold_reorder = ?,
        notification_threshold_low = ?,
        backup_frequency = ?,
        updated_at = NOW()
      WHERE id = 1
    `,
      [
        body.auto_notifications ? 1 : 0,
        body.email_notifications ? 1 : 0,
        body.email_host,
        body.email_port,
        body.email_user,
        body.email_password,
        body.email_from,
        Number.parseInt(body.notification_threshold_critical),
        Number.parseInt(body.notification_threshold_reorder),
        Number.parseInt(body.notification_threshold_low),
        body.backup_frequency,
      ],
    )

    return NextResponse.json({ message: "Pengaturan berhasil disimpan" })
  } catch (error) {
    console.error("Settings PUT error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
