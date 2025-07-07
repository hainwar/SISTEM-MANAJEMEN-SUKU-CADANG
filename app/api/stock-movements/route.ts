import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-utils"
import { validateData, stockMovementSchema } from "@/lib/validation"
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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const type = searchParams.get("type")
    const reason = searchParams.get("reason")
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let query = `
      SELECT sm.*, sp.code as part_code, sp.name as part_name, sp.category, sp.brand,
             u.full_name as created_by_name
      FROM stock_movements sm
      LEFT JOIN spare_parts sp ON sm.spare_part_id = sp.id
      LEFT JOIN users u ON sm.created_by = u.id
      WHERE 1=1
    `
    const params: any[] = []

    // Apply filters
    if (search) {
      query += " AND (sp.name LIKE ? OR sp.code LIKE ? OR sm.reference_number LIKE ?)"
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (type && (type === "in" || type === "out")) {
      query += " AND sm.type = ?"
      params.push(type)
    }

    if (reason) {
      query += " AND sm.reason = ?"
      params.push(reason)
    }

    if (dateFrom) {
      query += " AND DATE(sm.created_at) >= ?"
      params.push(dateFrom)
    }

    if (dateTo) {
      query += " AND DATE(sm.created_at) <= ?"
      params.push(dateTo)
    }

    // Add pagination - langsung ke query string
    const offset = (page - 1) * limit
    query += ` ORDER BY sm.created_at DESC LIMIT ${limit} OFFSET ${offset}`

    const movements = (await executeQuery(query, params)) as any[]

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM stock_movements sm
      LEFT JOIN spare_parts sp ON sm.spare_part_id = sp.id
      WHERE 1=1
    `
    const countParams: any[] = []

    if (search) {
      countQuery += " AND (sp.name LIKE ? OR sp.code LIKE ? OR sm.reference_number LIKE ?)"
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (type && (type === "in" || type === "out")) {
      countQuery += " AND sm.type = ?"
      countParams.push(type)
    }

    if (reason) {
      countQuery += " AND sm.reason = ?"
      countParams.push(reason)
    }

    if (dateFrom) {
      countQuery += " AND DATE(sm.created_at) >= ?"
      countParams.push(dateFrom)
    }

    if (dateTo) {
      countQuery += " AND DATE(sm.created_at) <= ?"
      countParams.push(dateTo)
    }

    const countResult = (await executeQuery(countQuery, countParams)) as any[]
    const total = countResult[0].total

    return NextResponse.json({
      data: movements,
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
    const validation = validateData(stockMovementSchema, body)

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

    // Check if spare part exists
    const spareParts = (await executeQuery("SELECT * FROM spare_parts WHERE id = ? AND is_active = 1", [
      data.spare_part_id,
    ])) as any[]

    if (spareParts.length === 0) {
      return NextResponse.json({ error: "Suku cadang tidak ditemukan" }, { status: 404 })
    }

    const sparePart = spareParts[0]

    // Check stock availability for outgoing movements
    if (data.type === "out" && sparePart.current_stock < data.quantity) {
      return NextResponse.json(
        {
          error: `Stok tidak mencukupi. Stok tersedia: ${sparePart.current_stock}`,
        },
        { status: 400 },
      )
    }

    // Calculate total price
    let unitPrice = data.unit_price
    let totalPrice = null

    // For outgoing stock, use current spare part price if no unit price provided
    if (data.type === "out" && !unitPrice) {
      unitPrice = sparePart.price
    }

    // Calculate total price if unit price is available
    if (unitPrice) {
      totalPrice = unitPrice * data.quantity
    }

    // Insert stock movement
    const result = (await executeQuery(
      `
      INSERT INTO stock_movements (
        spare_part_id, type, quantity, reason, reference_number, 
        supplier, unit_price, total_price, notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
      [
        data.spare_part_id,
        data.type,
        data.quantity,
        data.reason,
        data.reference_number,
        data.supplier,
        unitPrice,
        totalPrice,
        data.notes,
        decoded.sub, // user ID from token
      ],
    )) as any

    // Update spare part stock
    const stockChange = data.type === "in" ? data.quantity : -data.quantity
    await executeQuery("UPDATE spare_parts SET current_stock = current_stock + ? WHERE id = ?", [
      stockChange,
      data.spare_part_id,
    ])

    // Get the created movement with part details
    const createdMovement = (await executeQuery(
      `
      SELECT sm.*, sp.code as part_code, sp.name as part_name, sp.category, sp.brand,
             u.full_name as created_by_name
      FROM stock_movements sm
      LEFT JOIN spare_parts sp ON sm.spare_part_id = sp.id
      LEFT JOIN users u ON sm.created_by = u.id
      WHERE sm.id = ?
    `,
      [result.insertId],
    )) as any[]

    return NextResponse.json(
      {
        message: "Transaksi stok berhasil ditambahkan",
        data: createdMovement[0],
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
