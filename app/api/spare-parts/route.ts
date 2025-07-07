import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-utils"
import { validateData, sparePartSchema } from "@/lib/validation"
import { executeQuery } from "@/lib/database"
import { calculateROP } from "@/lib/utils"

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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let query = "SELECT * FROM spare_parts WHERE is_active = 1"
    const params: any[] = []

    // Apply filters
    if (search) {
      query += " AND (name LIKE ? OR code LIKE ? OR brand LIKE ?)"
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (category) {
      query += " AND category = ?"
      params.push(category)
    }

    if (status) {
      if (status === "critical") {
        query += " AND current_stock <= minimum_stock"
      } else if (status === "reorder") {
        query += " AND current_stock <= rop"
      } else if (status === "low") {
        query += " AND current_stock <= (rop * 1.5)"
      }
    }

    // Add pagination - langsung ke query string
    const offset = (page - 1) * limit
    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`

    const spareParts = (await executeQuery(query, params)) as any[]

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) as total FROM spare_parts WHERE is_active = 1"
    const countParams: any[] = []

    if (search) {
      countQuery += " AND (name LIKE ? OR code LIKE ? OR brand LIKE ?)"
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (category) {
      countQuery += " AND category = ?"
      countParams.push(category)
    }

    if (status) {
      if (status === "critical") {
        countQuery += " AND current_stock <= minimum_stock"
      } else if (status === "reorder") {
        countQuery += " AND current_stock <= rop"
      } else if (status === "low") {
        countQuery += " AND current_stock <= (rop * 1.5)"
      }
    }

    const countResult = (await executeQuery(countQuery, countParams)) as any[]
    const total = countResult[0].total

    return NextResponse.json({
      data: spareParts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)

    if (!decoded || !["admin", "gudang"].includes(decoded.role)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })
    }

    const body = await request.json()
    const validation = validateData(sparePartSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Data tidak valid",
          details: validation.errors,
        },
        { status: 400 },
      )
    }

    const data = validation.data!

    // Check for duplicate code
    const existing = (await executeQuery("SELECT id FROM spare_parts WHERE code = ?", [data.code])) as any[]

    if (existing.length > 0) {
      return NextResponse.json(
        {
          error: "Kode suku cadang sudah digunakan",
        },
        { status: 409 },
      )
    }

    // Calculate ROP
    const dailyDemand = 1.5
    const rop = calculateROP(dailyDemand, data.lead_time)

    // Insert new spare part
    const result = (await executeQuery(
      `
      INSERT INTO spare_parts (
        code, name, category, brand, price, current_stock, 
        minimum_stock, lead_time, rop, daily_demand,
        location, description, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `,
      [
        data.code,
        data.name,
        data.category,
        data.brand,
        data.price,
        data.current_stock,
        data.minimum_stock,
        data.lead_time,
        rop,
        dailyDemand,
        data.location,
        data.description,
      ],
    )) as any

    return NextResponse.json(
      {
        message: "Suku cadang berhasil ditambahkan",
        data: { id: result.insertId, ...data, rop, daily_demand: dailyDemand },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
