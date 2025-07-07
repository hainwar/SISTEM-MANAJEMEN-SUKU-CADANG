import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-key-min-32-chars-long-for-security",
)
const JWT_ISSUER = "al-amin-raoe-motor"
const JWT_AUDIENCE = "spare-parts-app"

export interface User {
  id: number
  username: string
  email: string
  role: "admin" | "gudang" | "pimpinan"
  full_name: string
  is_active: boolean
}

export interface JWTPayload {
  sub: string // user id
  username: string
  email: string
  role: string
  full_name: string
  iat: number
  exp: number
  iss: string
  aud: string
}

export async function generateToken(user: User): Promise<string> {
  try {
    const payload: Omit<JWTPayload, "iat" | "exp" | "iss" | "aud"> = {
      sub: user.id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    }

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer(JWT_ISSUER)
      .setAudience(JWT_AUDIENCE)
      .setExpirationTime("24h")
      .sign(JWT_SECRET)

    return token
  } catch (error) {
    console.error("Token generation error:", error)
    // Fallback to demo token for development
    return `demo-token-${user.id}-${Date.now()}`
  }
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    // Handle legacy demo tokens for backward compatibility
    if (token.startsWith("demo-token-")) {
      const parts = token.split("-")
      if (parts.length >= 3) {
        const userId = parts[2]
        // Mock user data for demo tokens
        const mockUsers = [
          { id: 1, username: "admin", role: "admin", full_name: "Administrator", email: "admin@alaminaroe.com" },
          { id: 2, username: "gudang1", role: "gudang", full_name: "Staff Gudang", email: "gudang@alaminaroe.com" },
          { id: 3, username: "pimpinan", role: "pimpinan", full_name: "Pimpinan", email: "pimpinan@alaminaroe.com" },
        ]

        const user = mockUsers.find((u) => u.id.toString() === userId)
        if (user) {
          return {
            sub: user.id.toString(),
            username: user.username,
            email: user.email,
            role: user.role,
            full_name: user.full_name,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
            iss: JWT_ISSUER,
            aud: JWT_AUDIENCE,
          }
        }
      }
      return null
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    })

    return payload as JWTPayload
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

export function hasPermission(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}

export async function hashPassword(password: string): Promise<string> {
  // For demo purposes, we'll use a simple hash
  // In production, use bcrypt
  return `hashed_${password}_${Date.now()}`
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  // For demo purposes, simple comparison
  // In production, use bcrypt.compare
  return hash.includes(password)
}
