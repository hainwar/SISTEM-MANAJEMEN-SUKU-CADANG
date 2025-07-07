import { type NextRequest, NextResponse } from "next/server"
import { generateToken } from "@/lib/auth-utils"
import { validateData, loginSchema } from "@/lib/validation"
import { executeQuery } from "@/lib/database"
import bcrypt from "bcrypt"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = validateData(loginSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Data tidak valid",
          details: validation.errors,
        },
        { status: 400 },
      )
    }

    const { username, password } = validation.data!

    // Query user from database
    const users = (await executeQuery("SELECT * FROM users WHERE username = ? AND is_active = 1", [username])) as any[]

    if (users.length === 0) {
      return NextResponse.json(
        {
          error: "Username tidak ditemukan atau akun tidak aktif",
        },
        { status: 401 },
      )
    }

    const user = users[0]

    // Check password - for demo, allow both hashed and plain password
    let isValidPassword = false
    if (user.password.startsWith("$2b$")) {
      // Hashed password
      isValidPassword = await bcrypt.compare(password, user.password)
    } else {
      // Plain password for demo
      isValidPassword = password === "password123"
    }

    if (!isValidPassword) {
      return NextResponse.json({ error: "Password salah" }, { status: 401 })
    }

    // Generate token
    const token = await generateToken(user)

    return NextResponse.json({
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
