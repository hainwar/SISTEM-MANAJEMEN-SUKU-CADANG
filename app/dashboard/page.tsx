"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { LowStockTable } from "@/components/dashboard/low-stock-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, TrendingUp, Package, Plus, FileText, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (typeof window === "undefined") return

    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      console.log("Fetching dashboard stats with token:", token.substring(0, 20) + "...")

      const response = await fetch("/api/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("Dashboard API response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Dashboard data received:", data)
        setStats(data)
      } else {
        const errorData = await response.json()
        console.error("Dashboard API error:", errorData)

        if (response.status === 401) {
          // Token invalid, redirect to login
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          router.push("/login")
          return
        }

        setError(errorData.error || "Gagal memuat data dashboard")
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error)
      setError("Terjadi kesalahan koneksi")
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    fetchDashboardStats()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat data dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header title="Dashboard" />

      <div className="px-6 space-y-6">
        {/* Stats Cards */}
        <StatsCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Items */}
          <LowStockTable items={stats.low_stock_items || []} />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Aksi Cepat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors hover:shadow-md"
                  onClick={() => router.push("/spare-parts")}
                >
                  <div className="text-center">
                    <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium">Tambah Suku Cadang</p>
                  </div>
                </Card>

                <Card
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors hover:shadow-md"
                  onClick={() => router.push("/daily-demand")}
                >
                  <div className="text-center">
                    <Plus className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-medium">Input Permintaan</p>
                  </div>
                </Card>

                <Card
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors hover:shadow-md"
                  onClick={() => router.push("/stock-movements")}
                >
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-sm font-medium">Transaksi Stok</p>
                  </div>
                </Card>

                <Card
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors hover:shadow-md"
                  onClick={() => router.push("/reports")}
                >
                  <div className="text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                    <p className="text-sm font-medium">Lihat Laporan</p>
                  </div>
                </Card>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Ringkasan Hari Ini</h4>
                <div className="space-y-2 text-sm">
                  <div
                    className="flex justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                    onClick={() => router.push("/today-sales")}
                  >
                    <span>Barang Keluar:</span>
                    <span className="font-medium text-blue-600 hover:underline">{stats.today_out} item</span>
                  </div>
                  <div
                    className="flex justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                    onClick={() => router.push("/stock-movements?type=in")}
                  >
                    <span>Barang Masuk:</span>
                    <span className="font-medium text-green-600 hover:underline">{stats.today_in} item</span>
                  </div>
                  <div
                    className="flex justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                    onClick={() => router.push("/notifications")}
                  >
                    <span>Notifikasi:</span>
                    <span className="font-medium text-red-600 hover:underline">
                      {stats.unread_notifications} belum dibaca
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
