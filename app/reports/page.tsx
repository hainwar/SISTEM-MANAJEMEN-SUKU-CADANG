"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency, formatDate } from "@/lib/utils"
import { FileText, Download, Calendar, TrendingUp, BarChart3, PieChart, RefreshCw } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export default function ReportsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [reportType, setReportType] = useState("stock")
  const [stockReport, setStockReport] = useState<any[]>([])
  const [movementReport, setMovementReport] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Initialize report type from URL params
  useEffect(() => {
    const typeParam = searchParams.get("type")
    if (typeParam) {
      setReportType(typeParam)
    }
  }, [searchParams])

  useEffect(() => {
    if (reportType === "stock") {
      fetchStockReport()
    } else if (reportType === "movement") {
      fetchMovementReport()
    }
  }, [reportType, dateFrom, dateTo])

  const fetchStockReport = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/spare-parts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const reportData = data.data.map((part: any) => ({
          ...part,
          status:
            part.current_stock <= part.minimum_stock ? "critical" : part.current_stock <= part.rop ? "reorder" : "good",
        }))
        setStockReport(reportData)
      } else {
        setError("Gagal memuat laporan stok")
      }
    } catch (error) {
      setError("Terjadi kesalahan koneksi")
    } finally {
      setLoading(false)
    }
  }

  const fetchMovementReport = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const params = new URLSearchParams()
      if (dateFrom) params.append("date_from", dateFrom)
      if (dateTo) params.append("date_to", dateTo)

      const response = await fetch(`/api/stock-movements?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMovementReport(data.data)
      } else {
        setError("Gagal memuat laporan pergerakan")
      }
    } catch (error) {
      setError("Terjadi kesalahan koneksi")
    } finally {
      setLoading(false)
    }
  }

  const criticalItems = stockReport.filter((item) => item.status === "critical")
  const reorderItems = stockReport.filter((item) => item.status === "reorder")
  const totalValue = stockReport.reduce((sum, item) => sum + item.current_stock * item.price, 0)

  const handleExportPDF = () => {
    alert("Fitur export PDF akan segera tersedia!")
  }

  const handleRefresh = () => {
    if (reportType === "stock") {
      fetchStockReport()
    } else if (reportType === "movement") {
      fetchMovementReport()
    }
  }

  return (
    <div className="space-y-6">
      <Header title="Laporan & Analitik" />

      <div className="px-6 space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Report Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generator Laporan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Jenis Laporan</Label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="stock">Laporan Stok</option>
                  <option value="movement">Laporan Pergerakan</option>
                  <option value="demand">Laporan Permintaan</option>
                  <option value="value">Laporan Nilai Inventori</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Dari Tanggal</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Sampai Tanggal</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button onClick={handleExportPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stockReport.length}</p>
                  <p className="text-sm text-gray-600">Total Item</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{criticalItems.length}</p>
                  <p className="text-sm text-gray-600">Stok Kritis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{reorderItems.length}</p>
                  <p className="text-sm text-gray-600">Perlu Reorder</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <PieChart className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalValue)}</p>
                  <p className="text-sm text-gray-600">Nilai Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stock Report */}
        {reportType === "stock" && (
          <Card>
            <CardHeader>
              <CardTitle>Laporan Stok Suku Cadang</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">Kode</th>
                      <th className="text-left py-3">Nama</th>
                      <th className="text-left py-3">Kategori</th>
                      <th className="text-center py-3">Stok</th>
                      <th className="text-center py-3">Min</th>
                      <th className="text-center py-3">ROP</th>
                      <th className="text-right py-3">Harga</th>
                      <th className="text-right py-3">Nilai</th>
                      <th className="text-center py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockReport.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{item.code}</code>
                        </td>
                        <td className="py-3 font-medium">{item.name}</td>
                        <td className="py-3 text-gray-600">{item.category}</td>
                        <td className="py-3 text-center font-bold">{item.current_stock}</td>
                        <td className="py-3 text-center">{item.minimum_stock}</td>
                        <td className="py-3 text-center">{item.rop}</td>
                        <td className="py-3 text-right">{formatCurrency(item.price)}</td>
                        <td className="py-3 text-right font-bold">{formatCurrency(item.current_stock * item.price)}</td>
                        <td className="py-3 text-center">
                          <Badge
                            variant={
                              item.status === "critical"
                                ? "destructive"
                                : item.status === "reorder"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {item.status === "critical" ? "Kritis" : item.status === "reorder" ? "Reorder" : "Aman"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Movement Report */}
        {reportType === "movement" && (
          <Card>
            <CardHeader>
              <CardTitle>Laporan Pergerakan Stok</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">Tanggal</th>
                      <th className="text-left py-3">Kode</th>
                      <th className="text-left py-3">Nama</th>
                      <th className="text-center py-3">Tipe</th>
                      <th className="text-center py-3">Jumlah</th>
                      <th className="text-left py-3">Alasan</th>
                      <th className="text-left py-3">Referensi</th>
                      <th className="text-right py-3">Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movementReport.map((movement) => (
                      <tr key={movement.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 text-xs">{formatDate(movement.created_at)}</td>
                        <td className="py-3">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{movement.part_code}</code>
                        </td>
                        <td className="py-3">{movement.part_name}</td>
                        <td className="py-3 text-center">
                          <Badge variant={movement.type === "in" ? "default" : "secondary"} className="text-xs">
                            {movement.type === "in" ? "Masuk" : "Keluar"}
                          </Badge>
                        </td>
                        <td className="py-3 text-center font-bold">
                          <span className={movement.type === "in" ? "text-green-600" : "text-red-600"}>
                            {movement.type === "in" ? "+" : "-"}
                            {movement.quantity}
                          </span>
                        </td>
                        <td className="py-3 capitalize">{movement.reason}</td>
                        <td className="py-3">{movement.reference_number || "-"}</td>
                        <td className="py-3 text-right">
                          {movement.total_price ? formatCurrency(movement.total_price) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Barang Paling Sering Keluar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockReport.slice(0, 5).map((part, index) => (
                  <div key={part.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{part.name}</p>
                        <p className="text-xs text-gray-500">{part.code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{Math.floor(Math.random() * 20) + 5}x</p>
                      <p className="text-xs text-gray-500">bulan ini</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tren Permintaan Bulanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Grafik tren permintaan akan ditampilkan di sini</p>
                  <p className="text-xs mt-2">Fitur dalam pengembangan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
