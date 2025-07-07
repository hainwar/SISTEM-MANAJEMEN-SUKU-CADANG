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

    // Get system statistics
    const sparePartsCount = (await executeQuery(
      "SELECT COUNT(*) as count FROM spare_parts WHERE is_active = 1",
      [],
    )) as any[]
    const transactionsCount = (await executeQuery("SELECT COUNT(*) as count FROM stock_movements", [])) as any[]
    const usersCount = (await executeQuery("SELECT COUNT(*) as count FROM users WHERE is_active = 1", [])) as any[]

    // Calculate uptime (mock data for now)
    const startTime = new Date("2024-01-01")
    const currentTime = new Date()
    const uptimeMs = currentTime.getTime() - startTime.getTime()
    const uptimeDays = Math.floor(uptimeMs / (1000 * 60 * 60 * 24))
    const uptimeHours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    const appInfo = {
      version: "v1.2.0",
      build: "2024.01.15",
      release_date: "15 Januari 2024",
      environment: "Production",
      node_version: process.version,
      mysql_version: "8.0",
      total_spare_parts: sparePartsCount[0]?.count || 0,
      total_transactions: transactionsCount[0]?.count || 0,
      active_users: usersCount[0]?.count || 1,
      uptime: `${uptimeDays} hari ${uptimeHours} jam`,
      memory_usage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      last_backup: "Hari ini, 02:00",
      backup_size: "12.5 MB",
    }

    return NextResponse.json(appInfo)
  } catch (error) {
    console.error("App info error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
