import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-min-32-chars-long-for-security-al-amin-raoe-motor-2024"

export interface User {
  id: number
  username: string
  email: string
  role: "admin" | "gudang" | "pimpinan"
  full_name: string
}

export function generateToken(user: User): string {
  // Untuk demo, gunakan token sederhana
  return `demo-token-${user.id}-${Date.now()}`
}

export function verifyToken(token: string): any {
  try {
    // Untuk demo, validasi token sederhana
    if (token.startsWith("demo-token-")) {
      const parts = token.split("-")
      const userId = Number.parseInt(parts[2])

      // Mock user data berdasarkan ID
      const mockUsers = [
        { id: 1, username: "admin", role: "admin", full_name: "Administrator" },
        { id: 2, username: "gudang1", role: "gudang", full_name: "Staff Gudang" },
        { id: 3, username: "pimpinan", role: "pimpinan", full_name: "Pimpinan" },
      ]

      return mockUsers.find((u) => u.id === userId) || null
    }

    // Fallback ke JWT jika tersedia
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function hasPermission(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}
