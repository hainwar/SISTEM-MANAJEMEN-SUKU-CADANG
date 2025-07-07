"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { formatCurrency, getStockStatus } from "@/lib/utils"
import { Search, LogIn, Package, AlertTriangle, TrendingDown, Wrench } from "lucide-react"

export default function PublicHomePage() {
  const [spareParts, setSpareParts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchPublicStockData()
  }, [])

  const fetchPublicStockData = async () => {
    try {
      const response = await fetch("/api/public/stock")
      if (response.ok) {
        const data = await response.json()
        setSpareParts(data.data)
      }
    } catch (error) {
      console.error("Error fetching public stock data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    router.push("/login")
  }

  // Filter spare parts based on search
  const filteredParts = spareParts.filter(
    (part) =>
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Get parts that need reorder (stock <= ROP)
  const reorderParts = filteredParts.filter((part) => part.current_stock <= part.rop)
  const lowStockParts = filteredParts.filter(
    (part) => part.current_stock <= part.minimum_stock && part.current_stock > 0,
  )

  const stats = {
    total: filteredParts.length,
    reorder: reorderParts.length,
    lowStock: lowStockParts.length,
    outOfStock: filteredParts.filter((part) => part.current_stock === 0).length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wrench className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Al-Amin Raoe Motor</h1>
                <p className="text-sm text-gray-600">Sistem Informasi Stok Suku Cadang</p>
              </div>
            </div>
            <Button onClick={handleLogin} className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Login Staff
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Informasi Ketersediaan Stok</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Lihat ketersediaan suku cadang motor terkini. Informasi ini diperbarui secara real-time untuk membantu Anda
            mengetahui stok yang tersedia.
          </p>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari suku cadang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  <p className="text-sm text-gray-600">Total Item</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats.reorder}</p>
                  <p className="text-sm text-gray-600">Perlu Reorder</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.lowStock}</p>
                  <p className="text-sm text-gray-600">Stok Rendah</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Package className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-600">{stats.outOfStock}</p>
                  <p className="text-sm text-gray-600">Habis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reorder Alert */}
        {reorderParts.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                Item yang Perlu Segera Dipesan ({reorderParts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reorderParts.slice(0, 6).map((part) => (
                  <div key={part.id} className="p-3 bg-white rounded-lg border border-orange-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{part.name}</p>
                        <p className="text-xs text-gray-500">{part.code}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {part.category}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Stok: {part.current_stock}</p>
                        <p className="text-xs text-gray-500">ROP: {part.rop}</p>
                      </div>
                      <p className="text-sm font-medium text-orange-600">Perlu Reorder</p>
                    </div>
                  </div>
                ))}
              </div>
              {reorderParts.length > 6 && (
                <p className="text-center text-sm text-orange-600 mt-4">
                  Dan {reorderParts.length - 6} item lainnya yang perlu direorder
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stock Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Daftar Stok Suku Cadang
              {searchTerm && <span className="text-sm font-normal">({filteredParts.length} hasil)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Kode</th>
                    <th className="text-left py-3">Nama & Kategori</th>
                    <th className="text-center py-3">Stok</th>
                    <th className="text-center py-3">ROP</th>
                    <th className="text-right py-3">Harga</th>
                    <th className="text-center py-3">Status</th>
                    <th className="text-left py-3">Lokasi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParts.map((part) => {
                    const status = getStockStatus(part.current_stock, part.rop, part.minimum_stock)
                    return (
                      <tr key={part.id} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{part.code}</code>
                        </td>
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{part.name}</p>
                            <p className="text-xs text-gray-500">
                              {part.category} • {part.brand}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div>
                            <span className={`font-bold ${status.color}`}>{part.current_stock}</span>
                            <p className="text-xs text-gray-500">Min: {part.minimum_stock}</p>
                          </div>
                        </td>
                        <td className="py-3 text-center font-medium">{part.rop}</td>
                        <td className="py-3 text-right font-medium">{formatCurrency(part.price)}</td>
                        <td className="py-3 text-center">
                          <Badge
                            variant={
                              status.status === "critical"
                                ? "destructive"
                                : status.status === "reorder"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {status.message}
                          </Badge>
                        </td>
                        <td className="py-3 text-xs text-gray-500">{part.location}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {filteredParts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada data suku cadang ditemukan</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Wrench className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Al-Amin Raoe Motor</h3>
              </div>
              <p className="text-sm text-blue-700 mb-4">
                Bengkel motor terpercaya dengan layanan berkualitas dan suku cadang original
              </p>
              <div className="text-xs text-blue-600 space-y-1">
                <p>📍 Alamat: Jl. Raya Motor No. 123, Kota</p>
                <p>📞 Telepon: (021) 1234-5678</p>
                <p>🕒 Buka: Senin - Sabtu, 08:00 - 17:00</p>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-xs text-blue-600">
                  Data stok diperbarui secara real-time • Terakhir update: {new Date().toLocaleString("id-ID")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
