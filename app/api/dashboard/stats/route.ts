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

    // Get statistics from database
    const totalPartsResult = (await executeQuery(
      "SELECT COUNT(*) as count FROM spare_parts WHERE is_active = 1",
      [],
    )) as any[]

    const criticalStockResult = (await executeQuery(
      "SELECT COUNT(*) as count FROM spare_parts WHERE current_stock <= minimum_stock AND is_active = 1",
      [],
    )) as any[]

    const reorderPointResult = (await executeQuery(
      "SELECT COUNT(*) as count FROM spare_parts WHERE current_stock <= rop AND is_active = 1",
      [],
    )) as any[]

    const totalValueResult = (await executeQuery(
      "SELECT COALESCE(SUM(current_stock * price), 0) as total FROM spare_parts WHERE is_active = 1",
      [],
    )) as any[]

    // Get today's movements
    const todayOutResult = (await executeQuery(
      "SELECT COUNT(*) as count FROM stock_movements WHERE type = 'out' AND DATE(created_at) = CURDATE()",
      [],
    )) as any[]

    const todayInResult = (await executeQuery(
      "SELECT COUNT(*) as count FROM stock_movements WHERE type = 'in' AND DATE(created_at) = CURDATE()",
      [],
    )) as any[]

    // Get unread notifications
    const unreadNotificationsResult = (await executeQuery(
      "SELECT COUNT(*) as count FROM notifications WHERE is_read = 0",
      [],
    )) as any[]

    // Get low stock items
    const lowStockItems = (await executeQuery(
      "SELECT * FROM spare_parts WHERE current_stock <= rop AND is_active = 1 ORDER BY current_stock ASC LIMIT 5",
      [],
    )) as any[]

    return NextResponse.json({
      total_parts: totalPartsResult[0].count,
      critical_stock: criticalStockResult[0].count,
      reorder_point: reorderPointResult[0].count,
      total_value: totalValueResult[0].total || 0,
      today_out: todayOutResult[0].count,
      today_in: todayInResult[0].count,
      unread_notifications: unreadNotificationsResult[0].count,
      low_stock_items: lowStockItems,
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
