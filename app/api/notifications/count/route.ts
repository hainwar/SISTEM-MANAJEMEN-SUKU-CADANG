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
    const allNotifications = []

    // Critical stock notifications
    const criticalItems = (await executeQuery(`
      SELECT id FROM spare_parts 
      WHERE is_active = 1 AND current_stock <= minimum_stock
    `)) as any[]

    for (const item of criticalItems) {
      allNotifications.push(`critical-${item.id}`)
    }

    // Reorder notifications
    const reorderItems = (await executeQuery(`
      SELECT id FROM spare_parts 
      WHERE is_active = 1 AND current_stock <= rop AND current_stock > minimum_stock
    `)) as any[]

    for (const item of reorderItems) {
      allNotifications.push(`reorder-${item.id}`)
    }

    // Low stock notifications
    const lowItems = (await executeQuery(`
      SELECT id FROM spare_parts 
      WHERE is_active = 1 AND current_stock <= (rop * 1.5) AND current_stock > rop
    `)) as any[]

    for (const item of lowItems) {
      allNotifications.push(`low-${item.id}`)
    }

    // Count unread notifications for this user
    let unreadCount = 0
    for (const notificationId of allNotifications) {
      const readStatus = (await executeQuery(
        `
        SELECT id FROM notification_reads 
        WHERE user_id = ? AND notification_id = ?
      `,
        [userId, notificationId],
      )) as any[]

      if (readStatus.length === 0) {
        unreadCount++
      }
    }

    return NextResponse.json({
      count: unreadCount,
      total: allNotifications.length,
      critical: criticalItems.length,
      reorder: reorderItems.length,
      low: lowItems.length,
    })
  } catch (error) {
    console.error("Notifications count error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
