"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Wrench } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    console.log("Attempting login with:", { username, password })

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      console.log("Response status:", response.status)

      const data = await response.json()
      console.log("Response data:", data)

      if (response.ok) {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", data.token)
          localStorage.setItem("user", JSON.stringify(data.user))
        }
        console.log("Login successful, redirecting...")
        router.push("/dashboard")
      } else {
        setError(data.error || "Login gagal")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Terjadi kesalahan koneksi")
    } finally {
      setLoading(false)
    }
  }

  // Quick login buttons for demo
  const quickLogin = (demoUsername: string) => {
    setUsername(demoUsername)
    setPassword("password123")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            <Wrench className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Al-Amin Raoe Motor</CardTitle>
          <CardDescription>Sistem Manajemen Suku Cadang</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-3">Demo Login (Klik untuk auto-fill):</p>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-left justify-start bg-transparent"
                onClick={() => quickLogin("admin")}
                type="button"
              >
                <strong>Admin:</strong>&nbsp;admin / password123
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-left justify-start bg-transparent"
                onClick={() => quickLogin("gudang1")}
                type="button"
              >
                <strong>Gudang:</strong>&nbsp;gudang1 / password123
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-left justify-start bg-transparent"
                onClick={() => quickLogin("pimpinan")}
                type="button"
              >
                <strong>Pimpinan:</strong>&nbsp;pimpinan / password123
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
