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

    // Get all notifications with details
    const notifications = []

    // Critical stock notifications
    const criticalItems = (await executeQuery(`
      SELECT id, code, name, current_stock, minimum_stock, rop, category, updated_at
      FROM spare_parts 
      WHERE is_active = 1 AND current_stock <= minimum_stock
      ORDER BY current_stock ASC
    `)) as any[]

    for (const item of criticalItems) {
      const notificationId = `critical-${item.id}`

      // Check if read by this user
      const readStatus = (await executeQuery(
        `
        SELECT id FROM notification_reads 
        WHERE user_id = ? AND notification_id = ?
      `,
        [userId, notificationId],
      )) as any[]

      notifications.push({
        id: notificationId,
        spare_part_id: item.id,
        code: item.code,
        name: item.name,
        current_stock: item.current_stock,
        minimum_stock: item.minimum_stock,
        rop: item.rop,
        category: item.category,
        type: "critical",
        message: `Stok kritis! Hanya tersisa ${item.current_stock} unit (minimum: ${item.minimum_stock})`,
        created_at: item.updated_at,
        is_read: readStatus.length > 0,
      })
    }

    // Reorder notifications
    const reorderItems = (await executeQuery(`
      SELECT id, code, name, current_stock, minimum_stock, rop, category, updated_at
      FROM spare_parts 
      WHERE is_active = 1 AND current_stock <= rop AND current_stock > minimum_stock
      ORDER BY current_stock ASC
    `)) as any[]

    for (const item of reorderItems) {
      const notificationId = `reorder-${item.id}`

      // Check if read by this user
      const readStatus = (await executeQuery(
        `
        SELECT id FROM notification_reads 
        WHERE user_id = ? AND notification_id = ?
      `,
        [userId, notificationId],
      )) as any[]

      notifications.push({
        id: notificationId,
        spare_part_id: item.id,
        code: item.code,
        name: item.name,
        current_stock: item.current_stock,
        minimum_stock: item.minimum_stock,
        rop: item.rop,
        category: item.category,
        type: "reorder",
        message: `Perlu reorder! Stok ${item.current_stock} sudah mencapai ROP (${item.rop})`,
        created_at: item.updated_at,
        is_read: readStatus.length > 0,
      })
    }

    // Low stock notifications
    const lowItems = (await executeQuery(`
      SELECT id, code, name, current_stock, minimum_stock, rop, category, updated_at
      FROM spare_parts 
      WHERE is_active = 1 AND current_stock <= (rop * 1.5) AND current_stock > rop
      ORDER BY current_stock ASC
    `)) as any[]

    for (const item of lowItems) {
      const notificationId = `low-${item.id}`

      // Check if read by this user
      const readStatus = (await executeQuery(
        `
        SELECT id FROM notification_reads 
        WHERE user_id = ? AND notification_id = ?
      `,
        [userId, notificationId],
      )) as any[]

      notifications.push({
        id: notificationId,
        spare_part_id: item.id,
        code: item.code,
        name: item.name,
        current_stock: item.current_stock,
        minimum_stock: item.minimum_stock,
        rop: item.rop,
        category: item.category,
        type: "low",
        message: `Stok rendah! Tersisa ${item.current_stock} unit (ROP: ${item.rop})`,
        created_at: item.updated_at,
        is_read: readStatus.length > 0,
      })
    }

    // Calculate stats
    const stats = {
      critical: criticalItems.length,
      reorder: reorderItems.length,
      low: lowItems.length,
      total: notifications.length,
      unread: notifications.filter((n) => !n.is_read).length,
    }

    // Sort notifications by priority (critical first) and unread first
    notifications.sort((a, b) => {
      // First sort by read status (unread first)
      if (a.is_read !== b.is_read) {
        return a.is_read ? 1 : -1
      }
      // Then sort by priority
      const priority = { critical: 3, reorder: 2, low: 1 }
      return priority[b.type] - priority[a.type]
    })

    return NextResponse.json({
      notifications,
      stats,
    })
  } catch (error) {
    console.error("Notifications error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
