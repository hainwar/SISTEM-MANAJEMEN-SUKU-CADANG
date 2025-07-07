import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // In a real application, you might want to:
    // 1. Add token to blacklist
    // 2. Clear server-side sessions
    // 3. Log the logout event

    return NextResponse.json({
      message: "Logout berhasil",
    })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
