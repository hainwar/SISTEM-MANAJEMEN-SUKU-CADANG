"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { Calendar, TrendingDown, Package, DollarSign, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TodaySalesPage() {
  const [todayMovements, setTodayMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchTodayMovements()
  }, [])

  const fetchTodayMovements = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const today = new Date().toISOString().split("T")[0]

      const response = await fetch(`/api/stock-movements?type=out&date_from=${today}&date_to=${today}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTodayMovements(data.data)
      } else {
        setError("Gagal memuat data penjualan hari ini")
      }
    } catch (error) {
      setError("Terjadi kesalahan koneksi")
    } finally {
      setLoading(false)
    }
  }

  const getReasonBadge = (reason: string) => {
    const variants: Record<string, any> = {
      service: { variant: "default", label: "Servis" },
      correction: { variant: "secondary", label: "Koreksi" },
      damaged: { variant: "destructive", label: "Rusak" },
      lost: { variant: "destructive", label: "Hilang" },
    }
    return variants[reason] || { variant: "outline", label: reason }
  }

  const totalItems = todayMovements.reduce((sum, movement) => sum + movement.quantity, 0)
  const totalValue = todayMovements.reduce((sum, movement) => {
  const price = Number(movement.total_price)
  return sum + (isNaN(price) ? 0 : price)
}, 0)


  // Group by category
  const categoryStats = todayMovements.reduce(
    (acc, movement) => {
      const category = movement.category || "Lainnya"
      if (!acc[category]) {
        acc[category] = { count: 0, value: 0 }
      }
      acc[category].count += 1
    acc[category].value += isNaN(Number(movement.total_price)) ? 0 : Number(movement.total_price)

      return acc
    },
    {} as Record<string, { count: number; value: number }>,
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header title="Penjualan Hari Ini" />

      <div className="px-6 space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchTodayMovements}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{todayMovements.length}</p>
                  <p className="text-sm text-gray-600">Total Transaksi</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{totalItems}</p>
                  <p className="text-sm text-gray-600">Total Item Keluar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalValue)}</p>
                  <p className="text-sm text-gray-600">Total Nilai</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Movements Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Daftar Barang Keluar Hari Ini
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchTodayMovements}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {todayMovements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada transaksi hari ini</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">No. Referensi</th>
                      <th className="text-left py-3">Suku Cadang</th>
                      <th className="text-center py-3">Jumlah</th>
                      <th className="text-right py-3">Harga Satuan</th>
                      <th className="text-right py-3">Total</th>
                      <th className="text-center py-3">Alasan</th>
                      <th className="text-left py-3">Keterangan</th>
                      <th className="text-center py-3">Waktu</th>
                      <th className="text-left py-3">Oleh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayMovements.map((movement) => {
                      const reasonBadge = getReasonBadge(movement.reason)
                      // Gunakan langsung unit_price dan total_price dari backend
                      return (
                        <tr key={movement.id} className="border-b hover:bg-gray-50">
                          <td className="py-3">
                            {movement.reference_number ? (
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{movement.reference_number}</code>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="py-3">
                            <div>
                              <p className="font-medium">{movement.part_name}</p>
                              <p className="text-xs text-gray-500">{movement.part_code}</p>
                            </div>
                          </td>
                          <td className="py-3 text-center font-bold text-red-600">-{movement.quantity}</td>
                          <td className="py-3 text-right">
                            {movement.unit_price ? formatCurrency(movement.unit_price) : "-"}
                          </td>
                          <td className="py-3 text-right font-bold">
                            {movement.total_price ? formatCurrency(movement.total_price) : "-"}
                          </td>
                          <td className="py-3 text-center">
                            <Badge variant={reasonBadge.variant} className="text-xs">
                              {reasonBadge.label}
                            </Badge>
                          </td>
                          <td className="py-3 text-gray-600 max-w-xs truncate">{movement.notes || "-"}</td>
                          <td className="py-3 text-center text-xs text-gray-500">
                            {formatDateTime(movement.created_at)}
                          </td>
                          <td className="py-3 text-xs text-gray-500">{movement.created_by_name}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary by Category */}
        {Object.keys(categoryStats).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan per Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(categoryStats).map(([category, stats]) => (
                  <Card key={category} className="p-4">
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{category}</p>
                      <p className="text-lg font-bold text-blue-600 mt-1">{stats.count} transaksi</p>
                      <p className="text-sm text-gray-600">{formatCurrency(stats.value)}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
