import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-utils"
import { executeQuery } from "@/lib/database"

export async function PUT(request: NextRequest) {
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

    // Get all current notifications
    const notifications = []

    // Critical stock notifications
    const criticalItems = (await executeQuery(`
      SELECT id FROM spare_parts 
      WHERE is_active = 1 AND current_stock <= minimum_stock
    `)) as any[]

    for (const item of criticalItems) {
      notifications.push(`critical-${item.id}`)
    }

    // Reorder notifications
    const reorderItems = (await executeQuery(`
      SELECT id FROM spare_parts 
      WHERE is_active = 1 AND current_stock <= rop AND current_stock > minimum_stock
    `)) as any[]

    for (const item of reorderItems) {
      notifications.push(`reorder-${item.id}`)
    }

    // Low stock notifications
    const lowItems = (await executeQuery(`
      SELECT id FROM spare_parts 
      WHERE is_active = 1 AND current_stock <= (rop * 1.5) AND current_stock > rop
    `)) as any[]

    for (const item of lowItems) {
      notifications.push(`low-${item.id}`)
    }

    // Mark all notifications as read
    for (const notificationId of notifications) {
      await executeQuery(
        `
        INSERT INTO notification_reads (user_id, notification_id, read_at)
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE read_at = NOW()
      `,
        [userId, notificationId],
      )
    }

    return NextResponse.json({
      message: "Semua notifikasi berhasil ditandai sebagai dibaca",
      count: notifications.length,
    })
  } catch (error) {
    console.error("Mark all notifications as read error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
