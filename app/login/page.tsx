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
import Image from "next/image"

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

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-100 to-white">
      <div className="flex w-full max-w-5xl shadow-xl rounded-xl overflow-hidden border border-gray-200 bg-white">
        {/* Form Login */}
<div className="w-full md:w-1/2 p-8 md:p-12 bg-blue-50">
  <CardHeader className="text-center">
    <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit shadow-sm">
      <Wrench className="h-8 w-8 text-blue-600" />
    </div>
    <CardTitle className="text-3xl font-bold text-gray-800">Al-Amin Raoe Motor</CardTitle>
    <CardDescription className="text-gray-600 text-sm">
      Sistem Manajemen Suku Cadang
    </CardDescription>
  </CardHeader>

  <CardContent className="space-y-5">
    {error && (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}

    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Masukkan username"
          required
          className="focus-visible:ring-blue-500 transition"
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
          className="focus-visible:ring-blue-500 transition"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white transition"
        disabled={loading}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? "Memproses..." : "Masuk"}
      </Button>
    </form>
  </CardContent>
</div>


        {/* Gambar */}
        <div className="hidden md:flex w-1/2 items-center justify-center bg-gradient-to-tr from-indigo-100 to-blue-200 p-8">
          <Image
            src="/logo-mekanik.png"
            alt="Logo Mekanik"
            width={400}
            height={400}
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  )
}
