"use client"

import { useState, useEffect } from "react"
import { Search, Calculator, TrendingUp, AlertTriangle, Package, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Header } from "@/components/layout/header"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, safeParseFloat, getPriorityBadge, exportToCSV } from "@/lib/utils"

interface NeedAnalysisItem {
  id: number
  code: string
  name: string
  category: string
  brand: string
  current_stock: number
  minimum_stock: number
  rop: number
  safety_stock: number
  price: number
  location: string
  daily_demand: number
  avg_daily_demand: number
  recommended_quantity: number
  priority: string
  estimated_cost: number
}

interface Summary {
  totalItems: number
  totalCost: number
  highPriority: number
  mediumPriority: number
  lowPriority: number
}

export default function NeedAnalysisPage() {
  const [items, setItems] = useState<NeedAnalysisItem[]>([])
  const [summary, setSummary] = useState<Summary>({
    totalItems: 0,
    totalCost: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const { toast } = useToast()

  const categories = ["Oli & Pelumas", "Rem", "Kelistrikan", "Filter", "Transmisi", "Suspensi", "Body", "Aksesoris"]

  const fetchNeedAnalysis = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const params = new URLSearchParams()

      if (searchTerm) params.append("search", searchTerm)
      if (categoryFilter) params.append("category", categoryFilter)
      if (priorityFilter) params.append("priority", priorityFilter)

      const response = await fetch(`/api/need-analysis?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch need analysis data")
      }

      const data = await response.json()
      setItems(data.data || [])
      setSummary(
        data.summary || {
          totalItems: 0,
          totalCost: 0,
          highPriority: 0,
          mediumPriority: 0,
          lowPriority: 0,
        },
      )
    } catch (error: any) {
      console.error("Error fetching need analysis:", error)
      toast({
        title: "Error",
        description: error.message || "Gagal memuat data analisis kebutuhan",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNeedAnalysis()
  }, [searchTerm, categoryFilter, priorityFilter])

  const handleExport = () => {
    if (items.length === 0) {
      toast({
        title: "Peringatan",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive",
      })
      return
    }

    const exportData = items.map((item) => ({
      kode: item.code,
      nama: item.name,
      kategori: item.category,
      brand: item.brand,
      stok_sekarang: item.current_stock,
      rop: item.rop,
      safety_stock: item.safety_stock,
      rata_rata_permintaan: safeParseFloat(item.avg_daily_demand, item.daily_demand).toFixed(1),
      jumlah_direkomendasikan: item.recommended_quantity,
      prioritas: item.priority,
      estimasi_biaya: item.estimated_cost,
      lokasi: item.location,
    }))

    exportToCSV(exportData, "analisis_kebutuhan")
    toast({
      title: "Berhasil",
      description: "Data analisis kebutuhan berhasil diekspor",
    })
  }

  return (
    <div className="space-y-6">
      <Header title="Analisis Kebutuhan" />

      <div className="px-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Item</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalItems}</div>
              <p className="text-xs text-muted-foreground">Perlu dibeli hari ini</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estimasi Biaya</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalCost)}</div>
              <p className="text-xs text-muted-foreground">Total pembelian</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prioritas Tinggi</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.highPriority}</div>
              <p className="text-xs text-muted-foreground">Item kritis</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prioritas Sedang</CardTitle>
              <Calculator className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{summary.mediumPriority}</div>
              <p className="text-xs text-muted-foreground">Perlu perhatian</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter & Pencarian</CardTitle>
            <CardDescription>Filter data berdasarkan kategori, prioritas, atau pencarian</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari berdasarkan kode, nama, atau brand..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select
                value={categoryFilter || "all"}
                onValueChange={(value) => setCategoryFilter(value === "all" ? "" : value)}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={priorityFilter || "all"}
                onValueChange={(value) => setPriorityFilter(value === "all" ? "" : value)}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Semua Prioritas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Prioritas</SelectItem>
                  <SelectItem value="tinggi">Prioritas Tinggi</SelectItem>
                  <SelectItem value="sedang">Prioritas Sedang</SelectItem>
                  <SelectItem value="rendah">Prioritas Rendah</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {items.length === 0 && !loading ? (
          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription>
              🎉 Tidak ada suku cadang yang perlu dibeli hari ini. Semua stok dalam kondisi aman.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Rekomendasi Pembelian</CardTitle>
              <CardDescription>
                Daftar suku cadang yang perlu dibeli berdasarkan analisis ROP dan Safety Stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Menganalisis kebutuhan...</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode</TableHead>
                        <TableHead>Nama Suku Cadang</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Stok Sekarang</TableHead>
                        <TableHead>ROP</TableHead>
                        <TableHead>Safety Stock</TableHead>
                        <TableHead>Rata-rata Permintaan</TableHead>
                        <TableHead>Jumlah Direkomendasikan</TableHead>
                        <TableHead>Prioritas</TableHead>
                        <TableHead>Estimasi Biaya</TableHead>
                        <TableHead>Lokasi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const priorityBadge = getPriorityBadge(item.priority)
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono">{item.code}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">{item.brand}</p>
                              </div>
                            </TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>
                              <span
                                className={item.current_stock <= item.minimum_stock ? "text-red-600 font-semibold" : ""}
                              >
                                {item.current_stock}
                              </span>
                            </TableCell>
                            <TableCell>{item.rop || item.minimum_stock * 2}</TableCell>
                            <TableCell>{item.safety_stock}</TableCell>
                            <TableCell>{safeParseFloat(item.avg_daily_demand, item.daily_demand).toFixed(1)}</TableCell>
                            <TableCell>
                              <span className="font-semibold text-blue-600">{item.recommended_quantity}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={priorityBadge.variant} className={priorityBadge.color}>
                                {priorityBadge.label}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(item.estimated_cost)}</TableCell>
                            <TableCell>{item.location}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
