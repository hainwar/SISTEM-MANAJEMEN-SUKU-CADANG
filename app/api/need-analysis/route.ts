import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { verifyToken } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const priority = searchParams.get("priority")
    const search = searchParams.get("search")

    console.log("Need Analysis API called with params:", { category, priority, search })

    // Build the main query
    const whereConditions = ["sp.is_active = 1"]
    const queryParams: any[] = []

    // Add search condition
    if (search) {
      whereConditions.push("(sp.code LIKE ? OR sp.name LIKE ? OR sp.brand LIKE ?)")
      const searchTerm = `%${search}%`
      queryParams.push(searchTerm, searchTerm, searchTerm)
    }

    // Add category filter
    if (category && category !== "all") {
      whereConditions.push("sp.category = ?")
      queryParams.push(category)
    }

    const baseQuery = `
      SELECT 
        sp.id,
        sp.code,
        sp.name,
        sp.category,
        sp.brand,
        sp.current_stock,
        sp.minimum_stock,
        sp.rop,
        sp.price,
        sp.location,
        sp.daily_demand,
        sp.lead_time,
        -- Safety Stock = minimum_stock (asumsi safety stock sama dengan minimum stock)
        sp.minimum_stock as safety_stock,
        -- Kebutuhan = (ROP + Safety Stock) - Stok Saat Ini
        GREATEST(0, (sp.rop + sp.minimum_stock) - sp.current_stock) as recommended_quantity,
        -- Prioritas berdasarkan tingkat kekritisan
        CASE 
          WHEN sp.current_stock <= sp.minimum_stock THEN 'tinggi'
          WHEN sp.current_stock <= sp.rop THEN 'sedang'
          ELSE 'rendah'
        END as priority,
        -- Estimasi biaya
        (GREATEST(0, (sp.rop + sp.minimum_stock) - sp.current_stock) * sp.price) as estimated_cost,
        -- Rata-rata permintaan harian dari histori (jika ada data)
        COALESCE(
          (SELECT AVG(ddl.jumlah) 
           FROM daily_demand_logs ddl 
           WHERE ddl.spare_part_id = sp.id 
           AND ddl.tanggal >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          ), 
          sp.daily_demand
        ) as avg_daily_demand
      FROM spare_parts sp
      WHERE ${whereConditions.join(" AND ")}
      -- Hanya tampilkan yang butuh dibeli (recommended_quantity > 0)
      HAVING recommended_quantity > 0
    `

    // Add priority filter after HAVING clause
    let finalQuery = baseQuery
    if (priority && priority !== "all") {
      finalQuery += ` AND priority = ?`
      queryParams.push(priority)
    }

    finalQuery += `
      ORDER BY 
        CASE priority 
          WHEN 'tinggi' THEN 1 
          WHEN 'sedang' THEN 2 
          ELSE 3 
        END,
        recommended_quantity DESC
    `

    console.log("Executing query:", finalQuery)
    console.log("With params:", queryParams)

    const results = await query(finalQuery, queryParams)

    // Calculate summary statistics
    const totalItems = results.length
    const totalCost = results.reduce((sum: number, item: any) => sum + Number.parseFloat(item.estimated_cost || 0), 0)
    const highPriority = results.filter((item: any) => item.priority === "tinggi").length
    const mediumPriority = results.filter((item: any) => item.priority === "sedang").length
    const lowPriority = results.filter((item: any) => item.priority === "rendah").length

    const summary = {
      totalItems,
      totalCost,
      highPriority,
      mediumPriority,
      lowPriority,
    }

    console.log("Need analysis results:", { summary, itemCount: results.length })

    return NextResponse.json({
      success: true,
      data: results,
      summary,
    })
  } catch (error) {
    console.error("Need analysis API error:", error)
    return NextResponse.json({ error: "Failed to fetch need analysis data" }, { status: 500 })
  }
}
