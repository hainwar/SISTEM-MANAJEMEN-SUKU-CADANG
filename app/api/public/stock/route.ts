import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET() {
  try {
    // Get public stock data from database
    const spareParts = (await executeQuery(
      "SELECT id, code, name, category, brand, price, current_stock, minimum_stock, rop, location FROM spare_parts WHERE is_active = 1 ORDER BY name",
      [],
    )) as any[]

    const lowStockCount = (await executeQuery(
      "SELECT COUNT(*) as count FROM spare_parts WHERE current_stock <= minimum_stock AND is_active = 1",
      [],
    )) as any[]

    const reorderCount = (await executeQuery(
      "SELECT COUNT(*) as count FROM spare_parts WHERE current_stock <= rop AND is_active = 1",
      [],
    )) as any[]

    return NextResponse.json({
      data: spareParts,
      last_updated: new Date().toISOString(),
      total_items: spareParts.length,
      low_stock_count: lowStockCount[0].count,
      reorder_count: reorderCount[0].count,
    })
  } catch (error) {
    console.error("Public Stock API Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
