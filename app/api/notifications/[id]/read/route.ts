import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-utils"
import { executeQuery } from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 })
    }

    const notificationId = params.id
    const userId = decoded.sub || decoded.id

    // Create notification_reads table if not exists
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS notification_reads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        notification_id VARCHAR(255) NOT NULL,
        read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_notification (user_id, notification_id)
      )
    `)

    // Mark notification as read for this user
    await executeQuery(
      `
      INSERT INTO notification_reads (user_id, notification_id, read_at)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE read_at = NOW()
    `,
      [userId, notificationId],
    )

    return NextResponse.json({
      message: "Notifikasi berhasil ditandai sebagai dibaca",
    })
  } catch (error) {
    console.error("Mark notification as read error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
