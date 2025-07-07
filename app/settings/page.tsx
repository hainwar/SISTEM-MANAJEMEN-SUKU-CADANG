"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Save, Info, Globe, Palette, Loader2 } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState({
    theme_mode: "light",
    language: "id",
  })

  const [appInfo, setAppInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    fetchSettings()
    fetchAppInfo()
  }, [router])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      console.log("Fetching settings with token:", token.substring(0, 20) + "...")

      const response = await fetch("/api/settings/preferences", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("Settings fetch response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Settings data received:", data)
        setSettings({ ...settings, ...data })
      } else if (response.status === 401) {
        // Token invalid, redirect to login
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/login")
      } else {
        const errorData = await response.json()
        console.error("Settings fetch error:", errorData)
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    }
  }

  const fetchAppInfo = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("/api/app/info", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAppInfo(data)
      } else if (response.status === 401) {
        // Token invalid, redirect to login
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/login")
      }
    } catch (error) {
      console.error("Error fetching app info:", error)
    }
  }

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Token tidak valid")
        router.push("/login")
        return
      }

      console.log("Submitting settings:", settings)
      console.log("Using token:", token.substring(0, 20) + "...")

      const response = await fetch("/api/settings/preferences", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      console.log("Settings submit response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Settings submit success:", data)
        setSuccess("Pengaturan berhasil disimpan!")
        setTimeout(() => setSuccess(""), 3000)

        // Apply theme immediately
        if (settings.theme_mode === "dark") {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
      } else if (response.status === 401) {
        // Token invalid, redirect to login
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/login")
      } else {
        const errorData = await response.json()
        console.error("Settings submit error:", errorData)
        setError(errorData.error || "Gagal menyimpan pengaturan")
      }
    } catch (error) {
      console.error("Settings submit error:", error)
      setError("Terjadi kesalahan koneksi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Header title="Pengaturan" />

      <div className="px-6 space-y-6">
        {success && (
          <Alert>
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Pengaturan Pengguna
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSettingsSubmit} className="space-y-6">
                {/* Theme Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-gray-700 border-b pb-2 flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Tampilan
                  </h4>

                  <div className="space-y-3">
                    <Label>Mode Tema</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <div
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          settings.theme_mode === "light"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSettings({ ...settings, theme_mode: "light" })}
                      >
                        <div className="text-center">
                          <div className="w-8 h-8 mx-auto mb-2 bg-white border border-gray-300 rounded"></div>
                          <span className="text-sm font-medium">Terang</span>
                        </div>
                      </div>

                      <div
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          settings.theme_mode === "dark"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSettings({ ...settings, theme_mode: "dark" })}
                      >
                        <div className="text-center">
                          <div className="w-8 h-8 mx-auto mb-2 bg-gray-800 border border-gray-600 rounded"></div>
                          <span className="text-sm font-medium">Gelap</span>
                        </div>
                      </div>

                      <div
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          settings.theme_mode === "auto"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSettings({ ...settings, theme_mode: "auto" })}
                      >
                        <div className="text-center">
                          <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-r from-white to-gray-800 border border-gray-300 rounded"></div>
                          <span className="text-sm font-medium">Otomatis</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Mode otomatis akan mengikuti pengaturan sistem operasi Anda</p>
                  </div>
                </div>

                {/* Language Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-gray-700 border-b pb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Bahasa
                  </h4>

                  <div className="space-y-3">
                    <Label>Bahasa Interface</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          settings.language === "id"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSettings({ ...settings, language: "id" })}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-4 bg-red-500 relative">
                            <div className="w-6 h-2 bg-white absolute top-1"></div>
                          </div>
                          <div>
                            <div className="font-medium text-sm">Bahasa Indonesia</div>
                            <div className="text-xs text-gray-500">Indonesia</div>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          settings.language === "en"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSettings({ ...settings, language: "en" })}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-4 bg-blue-600 relative">
                            <div className="w-3 h-2 bg-red-500 absolute"></div>
                            <div className="w-1 h-4 bg-white absolute left-1"></div>
                            <div className="w-1 h-4 bg-white absolute right-1"></div>
                          </div>
                          <div>
                            <div className="font-medium text-sm">English</div>
                            <div className="text-xs text-gray-500">United States</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Perubahan bahasa akan diterapkan setelah refresh halaman</p>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Simpan Pengaturan
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Application Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-green-600" />
                Informasi Aplikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* App Details */}
              <div className="space-y-4">
                <div className="text-center pb-4 border-b">
                  <div className="w-16 h-16 mx-auto mb-3 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Settings className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Sistem Manajemen Suku Cadang</h3>
                  <p className="text-sm text-gray-500">Al-Amin Raoe Motor</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Versi Aplikasi:</span>
                    <span className="font-medium">{appInfo?.version || "v1.2.0"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Build:</span>
                    <span className="font-medium">{appInfo?.build || "2025.02.25"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rilis:</span>
                    <span className="font-medium">{appInfo?.release_date || "15 Mei 2025"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform:</span>
                    <span className="font-medium">Web Application</span>
                  </div>
                </div>
              </div>

              {/* System Stats */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-gray-700 border-b pb-2">Statistik Sistem</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Suku Cadang:</span>
                    <span className="font-medium">{appInfo?.total_spare_parts || "0"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Transaksi:</span>
                    <span className="font-medium">{appInfo?.total_transactions || "0"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pengguna Aktif:</span>
                    <span className="font-medium">{appInfo?.active_users || "1"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uptime:</span>
                    <span className="font-medium">{appInfo?.uptime || "7 hari 12 jam"}</span>
                  </div>
                </div>
              </div>

              {/* Technical Info */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-gray-700 border-b pb-2">Informasi Teknis</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Framework:</span>
                    <span className="font-medium">Next.js 14</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Database:</span>
                    <span className="font-medium">MySQL 8.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Server:</span>
                    <span className="font-medium">Node.js {appInfo?.node_version || "18.x"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">UI Library:</span>
                    <span className="font-medium">Tailwind CSS</span>
                  </div>
                </div>
              </div>

              {/* Support Info */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-gray-700 border-b pb-2">Dukungan</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Developer:</span>
                    <span className="font-medium">Hairul Anwar</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email Support:</span>
                    <span className="font-medium text-blue-600">alaminraoe@gmail.com</span>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-600">Sistem Berjalan Normal</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
