import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-utils"
import { validateData, sparePartSchema } from "@/lib/validation"
import { executeQuery } from "@/lib/database"
import { calculateROP } from "@/lib/utils"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const sparePart = (await executeQuery("SELECT * FROM spare_parts WHERE id = ? AND is_active = 1", [
      params.id,
    ])) as any[]

    if (sparePart.length === 0) {
      return NextResponse.json({ error: "Suku cadang tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ data: sparePart[0] })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    console.log("Received data for update:", body)

    // Validate input data
    const validation = validateData(sparePartSchema, body)

    if (!validation.success) {
      console.log("Validation errors:", validation.errors)
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
    const existing = (await executeQuery("SELECT * FROM spare_parts WHERE id = ? AND is_active = 1", [
      params.id,
    ])) as any[]

    if (existing.length === 0) {
      return NextResponse.json({ error: "Suku cadang tidak ditemukan" }, { status: 404 })
    }

    // Check for duplicate code (excluding current record)
    const duplicateCheck = (await executeQuery("SELECT id FROM spare_parts WHERE code = ? AND id != ?", [
      data.code,
      params.id,
    ])) as any[]

    if (duplicateCheck.length > 0) {
      return NextResponse.json({ error: "Kode suku cadang sudah digunakan" }, { status: 409 })
    }

    // Calculate ROP
    const dailyDemand = existing[0].daily_demand || 1.5
    const rop = calculateROP(dailyDemand, data.lead_time)

    // Update spare part
    await executeQuery(
      `
      UPDATE spare_parts SET
        code = ?, name = ?, category = ?, brand = ?, price = ?, 
        current_stock = ?, minimum_stock = ?, lead_time = ?, rop = ?, 
        daily_demand = ?, location = ?, description = ?, updated_at = NOW()
      WHERE id = ?
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
        params.id,
      ],
    )

    // Get updated record
    const updated = (await executeQuery("SELECT * FROM spare_parts WHERE id = ?", [params.id])) as any[]

    return NextResponse.json({
      message: "Suku cadang berhasil diperbarui",
      data: updated[0],
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })
    }

    // Check if spare part exists
    const existing = (await executeQuery("SELECT * FROM spare_parts WHERE id = ? AND is_active = 1", [
      params.id,
    ])) as any[]

    if (existing.length === 0) {
      return NextResponse.json({ error: "Suku cadang tidak ditemukan" }, { status: 404 })
    }

    // Check if spare part is used in stock movements
    const usageCheck = (await executeQuery("SELECT COUNT(*) as count FROM stock_movements WHERE spare_part_id = ?", [
      params.id,
    ])) as any[]

    if (usageCheck[0].count > 0) {
      // Soft delete if used in transactions
      await executeQuery("UPDATE spare_parts SET is_active = 0, updated_at = NOW() WHERE id = ?", [params.id])
    } else {
      // Hard delete if not used
      await executeQuery("DELETE FROM spare_parts WHERE id = ?", [params.id])
    }

    return NextResponse.json({
      message: "Suku cadang berhasil dihapus",
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
