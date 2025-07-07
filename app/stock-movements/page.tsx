"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { ArrowUpDown, Plus, ArrowUp, ArrowDown, Search, RefreshCw } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<any[]>([])
  const [spareParts, setSpareParts] = useState<any[]>([])
  const [sparePartsMap, setSparePartsMap] = useState<Record<string, any>>({})
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize filter from URL params
  useEffect(() => {
    const typeParam = searchParams.get("type")
    if (typeParam && (typeParam === "in" || typeParam === "out")) {
      setFilterType(typeParam)
    }
  }, [searchParams])

  // Form states
  const [formData, setFormData] = useState({
    spare_part_id: "",
    type: "in",
    quantity: "",
    reason: "purchase",
    reference_number: "",
    supplier: "",
    unit_price: "",
    notes: "",
  })

  useEffect(() => {
    fetchMovements()
    fetchSpareParts()
  }, [searchTerm, filterType])

  const fetchMovements = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const params = new URLSearchParams()

      if (searchTerm) params.append("search", searchTerm)
      if (filterType !== "all") params.append("type", filterType)

      const response = await fetch(`/api/stock-movements?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMovements(data.data)
      } else {
        setError("Gagal memuat data transaksi stok")
      }
    } catch (error) {
      setError("Terjadi kesalahan koneksi")
    } finally {
      setLoading(false)
    }
  }

  const fetchSpareParts = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/spare-parts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSpareParts(data.data)

        // Create a map for easy price lookup
        const partsMap: Record<string, any> = {}
        data.data.forEach((part: any) => {
          partsMap[part.id] = part
        })
        setSparePartsMap(partsMap)
      }
    } catch (error) {
      console.error("Error fetching spare parts:", error)
    }
  }

  // Handle spare part selection to auto-populate price
  const handleSparePartChange = (sparePartId: string) => {
    setFormData((prev) => ({
      ...prev,
      spare_part_id: sparePartId,
      unit_price: sparePartId && sparePartsMap[sparePartId] ? sparePartsMap[sparePartId].price.toString() : "",
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const token = localStorage.getItem("token")

      // For outgoing stock, use the current price from spare part if no unit price specified
      let unitPrice = formData.unit_price ? Number.parseFloat(formData.unit_price) : undefined

      if (formData.type === "out" && !unitPrice && sparePartsMap[formData.spare_part_id]) {
        unitPrice = sparePartsMap[formData.spare_part_id].price
      }

      const response = await fetch("/api/stock-movements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          spare_part_id: Number.parseInt(formData.spare_part_id),
          quantity: Number.parseInt(formData.quantity),
          unit_price: unitPrice,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess("Transaksi stok berhasil ditambahkan")
        setShowForm(false)
        setFormData({
          spare_part_id: "",
          type: "in",
          quantity: "",
          reason: "purchase",
          reference_number: "",
          supplier: "",
          unit_price: "",
          notes: "",
        })
        fetchMovements() // Refresh data
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Gagal menambahkan transaksi")
      }
    } catch (error) {
      setError("Terjadi kesalahan koneksi")
    }
  }

  const getMovementIcon = (type: string) => {
    return type === "in" ? (
      <ArrowDown className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowUp className="h-4 w-4 text-red-600" />
    )
  }

  const getReasonBadge = (reason: string) => {
    const variants: Record<string, any> = {
      purchase: { variant: "default", label: "Pembelian" },
      service: { variant: "secondary", label: "Servis" },
      correction: { variant: "outline", label: "Koreksi" },
      damaged: { variant: "destructive", label: "Rusak" },
      lost: { variant: "destructive", label: "Hilang" },
      return: { variant: "secondary", label: "Retur" },
    }
    return variants[reason] || { variant: "outline", label: reason }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header title="Transaksi Stok" />

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

        {/* Controls */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari berdasarkan nama, kode, atau referensi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">Semua Transaksi</option>
                  <option value="in">Stok Masuk</option>
                  <option value="out">Stok Keluar</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchMovements}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={() => setShowForm(!showForm)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Transaksi
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Tambah Transaksi Stok</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Suku Cadang</Label>
                    <select
                      value={formData.spare_part_id}
                      onChange={(e) => handleSparePartChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Pilih Suku Cadang</option>
                      {spareParts.map((part) => (
                        <option key={part.id} value={part.id}>
                          {part.code} - {part.name} (Stok: {part.current_stock}) - {formatCurrency(part.price)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipe Transaksi</Label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="in">Stok Masuk</option>
                      <option value="out">Stok Keluar</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Jumlah</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Alasan</Label>
                    <select
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {formData.type === "in" ? (
                        <>
                          <option value="purchase">Pembelian</option>
                          <option value="return">Retur</option>
                          <option value="correction">Koreksi</option>
                        </>
                      ) : (
                        <>
                          <option value="service">Servis</option>
                          <option value="correction">Koreksi</option>
                          <option value="damaged">Rusak</option>
                          <option value="lost">Hilang</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>No. Referensi</Label>
                    <Input
                      value={formData.reference_number}
                      onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                      placeholder="Contoh: PO-001, SRV-001"
                    />
                  </div>

                  {formData.type === "in" && (
                    <div className="space-y-2">
                      <Label>Supplier</Label>
                      <Input
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        placeholder="Nama supplier"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>
                      Harga Satuan
                      {formData.type === "out" && " (otomatis dari harga suku cadang)"}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                      placeholder="0"
                      readOnly={formData.type === "out"}
                      className={formData.type === "out" ? "bg-gray-100" : ""}
                    />
                    {formData.quantity && formData.unit_price && (
                      <p className="text-sm text-gray-600">
                        Total:{" "}
                        {formatCurrency(Number.parseFloat(formData.unit_price) * Number.parseInt(formData.quantity))}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Keterangan</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Keterangan tambahan"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit">Simpan Transaksi</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Movements Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Riwayat Transaksi ({movements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Waktu</th>
                    <th className="text-left py-3">Suku Cadang</th>
                    <th className="text-center py-3">Tipe</th>
                    <th className="text-center py-3">Jumlah</th>
                    <th className="text-center py-3">Alasan</th>
                    <th className="text-right py-3">Harga Satuan</th>
                    <th className="text-right py-3">Total Nilai</th>
                    <th className="text-left py-3">Referensi</th>
                    <th className="text-left py-3">Keterangan</th>
                    <th className="text-left py-3">Oleh</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => {
                    const reasonBadge = getReasonBadge(movement.reason)

                    return (
                      <tr key={movement.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 text-xs text-gray-500">{formatDateTime(movement.created_at)}</td>
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{movement.part_name}</p>
                            <p className="text-xs text-gray-500">{movement.part_code}</p>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {getMovementIcon(movement.type)}
                            <span className={movement.type === "in" ? "text-green-600" : "text-red-600"}>
                              {movement.type === "in" ? "Masuk" : "Keluar"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-center font-bold">
                          <span className={movement.type === "in" ? "text-green-600" : "text-red-600"}>
                            {movement.type === "in" ? "+" : "-"}
                            {movement.quantity}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <Badge variant={reasonBadge.variant} className="text-xs">
                            {reasonBadge.label}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          {movement.unit_price ? formatCurrency(movement.unit_price) : "-"}
                        </td>
                        <td className="py-3 text-right font-medium">
                          {movement.total_price ? formatCurrency(movement.total_price) : "-"}
                        </td>
                        <td className="py-3">
                          {movement.reference_number && (
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">{movement.reference_number}</code>
                          )}
                          {movement.supplier && <p className="text-xs text-gray-500 mt-1">{movement.supplier}</p>}
                        </td>
                        <td className="py-3 text-gray-600 max-w-xs truncate">{movement.notes}</td>
                        <td className="py-3 text-xs text-gray-500">{movement.created_by_name}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {movements.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ArrowUpDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada transaksi ditemukan</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
