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
    console.log("GET preferences - Token received:", token.substring(0, 20) + "...")

    const decoded = await verifyToken(token)
    console.log("GET preferences - Decoded token:", decoded)

    if (!decoded || !decoded.sub) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 })
    }

    const userId = decoded.sub
    console.log("GET preferences - User ID:", userId)

    // First, ensure the table exists
    await executeQuery(
      `
      CREATE TABLE IF NOT EXISTS user_preferences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        theme_mode ENUM('light', 'dark', 'auto') DEFAULT 'light',
        language ENUM('id', 'en') DEFAULT 'id',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_preferences (user_id)
      )
    `,
      [],
    )

    // Get user preferences from database
    const preferences = (await executeQuery("SELECT theme_mode, language FROM user_preferences WHERE user_id = ?", [
      userId,
    ])) as any[]

    if (preferences.length === 0) {
      // Create default preferences if not exists
      await executeQuery(
        "INSERT INTO user_preferences (user_id, theme_mode, language, created_at, updated_at) VALUES (?, 'light', 'id', NOW(), NOW())",
        [userId],
      )

      return NextResponse.json({
        theme_mode: "light",
        language: "id",
      })
    }

    const preference = preferences[0]
    return NextResponse.json({
      theme_mode: preference.theme_mode || "light",
      language: preference.language || "id",
    })
  } catch (error) {
    console.error("Preferences GET error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    console.log("PUT preferences - Token received:", token.substring(0, 20) + "...")

    const decoded = await verifyToken(token)
    console.log("PUT preferences - Decoded token:", decoded)

    if (!decoded || !decoded.sub) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 })
    }

    const userId = decoded.sub
    console.log("PUT preferences - User ID:", userId)

    const body = await request.json()
    console.log("PUT preferences - Request body:", body)

    // Validate input
    if (!body.theme_mode || !body.language) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    // Validate theme_mode
    if (!["light", "dark", "auto"].includes(body.theme_mode)) {
      return NextResponse.json({ error: "Mode tema tidak valid" }, { status: 400 })
    }

    // Validate language
    if (!["id", "en"].includes(body.language)) {
      return NextResponse.json({ error: "Bahasa tidak valid" }, { status: 400 })
    }

    // Ensure the table exists
    await executeQuery(
      `
      CREATE TABLE IF NOT EXISTS user_preferences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        theme_mode ENUM('light', 'dark', 'auto') DEFAULT 'light',
        language ENUM('id', 'en') DEFAULT 'id',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_preferences (user_id)
      )
    `,
      [],
    )

    // Update user preferences
    await executeQuery(
      `
      INSERT INTO user_preferences (user_id, theme_mode, language, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        theme_mode = VALUES(theme_mode),
        language = VALUES(language),
        updated_at = NOW()
    `,
      [userId, body.theme_mode, body.language],
    )

    console.log("PUT preferences - Successfully updated preferences")
    return NextResponse.json({ message: "Pengaturan berhasil disimpan" })
  } catch (error) {
    console.error("Preferences PUT error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
