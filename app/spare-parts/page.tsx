"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Package, FileSpreadsheet, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Header } from "@/components/layout/header"
import { SparePartForm } from "@/components/spare-parts/spare-part-form"
import { ImportExcelModal } from "@/components/spare-parts/import-excel-modal"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useToast } from "@/hooks/use-toast"

interface SparePart {
  id: number
  code: string
  name: string
  category: string
  brand: string
  price: number
  current_stock: number
  minimum_stock: number
  lead_time: number
  rop: number
  location: string
  description: string
  created_at: string
  updated_at: string
}

interface ApiResponse {
  data: SparePart[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function SparePartsPage() {
  const [spareParts, setSpareParts] = useState<SparePart[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingPart, setEditingPart] = useState<SparePart | null>(null)
  const [deletingPart, setDeletingPart] = useState<SparePart | null>(null)
  const { toast } = useToast()

  const categories = ["Oli & Pelumas", "Rem", "Kelistrikan", "Filter", "Transmisi", "Suspensi", "Body", "Aksesoris"]

  const fetchSpareParts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "50",
      })

      if (searchTerm) params.append("search", searchTerm)
      if (categoryFilter) params.append("category", categoryFilter)
      if (statusFilter) params.append("status", statusFilter)

      const response = await fetch(`/api/spare-parts?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch spare parts")
      }

      const data: ApiResponse = await response.json()
      setSpareParts(data.data)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error("Error fetching spare parts:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data suku cadang",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSpareParts()
  }, [currentPage, searchTerm, categoryFilter, statusFilter])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value === "all" ? "" : value)
    setCurrentPage(1)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === "all" ? "" : value)
    setCurrentPage(1)
  }

  const getStockStatus = (part: SparePart) => {
    if (part.current_stock <= part.minimum_stock) {
      return { label: "Critical", variant: "destructive" as const }
    } else if (part.current_stock <= part.rop) {
      return { label: "Reorder", variant: "secondary" as const }
    } else if (part.current_stock <= part.rop * 1.5) {
      return { label: "Low", variant: "outline" as const }
    }
    return { label: "Normal", variant: "default" as const }
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingPart(null)
    fetchSpareParts()
    toast({
      title: "Berhasil",
      description: editingPart ? "Suku cadang berhasil diperbarui" : "Suku cadang berhasil ditambahkan",
    })
  }

  const handleEdit = async (part: SparePart) => {
    try {
      // Fetch the latest data for the spare part to ensure we have complete information
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/spare-parts/${part.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch spare part details")
      }

      const result = await response.json()
      setEditingPart(result.data)
      setIsFormOpen(true)
    } catch (error) {
      console.error("Error fetching spare part details:", error)
      toast({
        title: "Error",
        description: "Gagal memuat detail suku cadang",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (part: SparePart) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/spare-parts/${part.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete spare part")
      }

      toast({
        title: "Berhasil",
        description: "Suku cadang berhasil dihapus",
      })
      fetchSpareParts()
    } catch (error: any) {
      console.error("Error deleting spare part:", error)
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus suku cadang",
        variant: "destructive",
      })
    } finally {
      setDeletingPart(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const exportToExcel = () => {
    // Export current data to Excel
    const exportData = spareParts.map((part) => ({
      kode: part.code,
      nama: part.name,
      kategori: part.category,
      brand: part.brand,
      harga: part.price,
      stok_saat_ini: part.current_stock,
      stok_minimum: part.minimum_stock,
      lead_time: part.lead_time,
      rop: part.rop,
      lokasi: part.location,
      keterangan: part.description,
    }))

    const headers = [
      "kode",
      "nama",
      "kategori",
      "brand",
      "harga",
      "stok_saat_ini",
      "stok_minimum",
      "lead_time",
      "rop",
      "lokasi",
      "keterangan",
    ]

    const csvContent = [
      headers.join(","),
      ...exportData.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row]
            return typeof value === "string" && value.includes(",") ? `"${value}"` : value
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `data_suku_cadang_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <Header title="Manajemen Suku Cadang" />

      <div className="px-6 space-y-6">
        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">Kelola inventori suku cadang Anda</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToExcel} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button onClick={() => setIsImportOpen(true)} variant="outline">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Import Excel
            </Button>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Suku Cadang
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter & Pencarian</CardTitle>
            <CardDescription>Gunakan filter untuk menemukan suku cadang yang Anda cari</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari berdasarkan kode, nama, atau brand..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={categoryFilter || "all"} onValueChange={handleCategoryFilter}>
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
              <Select value={statusFilter || "all"} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="reorder">Reorder</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Suku Cadang</CardTitle>
            <CardDescription>
              Total: {spareParts.length} item{spareParts.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Memuat data...</p>
                </div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Stok</TableHead>
                      <TableHead>Min. Stok</TableHead>
                      <TableHead>ROP</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>Terakhir Update</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {spareParts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-8">
                          <div className="text-muted-foreground">
                            <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p>Tidak ada suku cadang ditemukan</p>
                            <p className="text-sm">Coba ubah filter atau tambah suku cadang baru</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      spareParts.map((part) => {
                        const status = getStockStatus(part)
                        return (
                          <TableRow key={part.id}>
                            <TableCell className="font-mono">{part.code}</TableCell>
                            <TableCell className="font-medium">{part.name}</TableCell>
                            <TableCell>{part.category}</TableCell>
                            <TableCell>{part.brand}</TableCell>
                            <TableCell>{formatCurrency(part.price)}</TableCell>
                            <TableCell>{part.current_stock}</TableCell>
                            <TableCell>{part.minimum_stock}</TableCell>
                            <TableCell>{part.rop}</TableCell>
                            <TableCell>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </TableCell>
                            <TableCell>{part.location}</TableCell>
                            <TableCell>{formatDate(part.updated_at)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(part)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setDeletingPart(part)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Halaman {currentPage} dari {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPart ? "Edit Suku Cadang" : "Tambah Suku Cadang"}</DialogTitle>
          </DialogHeader>
          <SparePartForm
            initialData={editingPart}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setIsFormOpen(false)
              setEditingPart(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Import Excel Modal */}
      <ImportExcelModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => {
          setIsImportOpen(false)
          fetchSpareParts()
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingPart}
        onClose={() => setDeletingPart(null)}
        onConfirm={() => deletingPart && handleDelete(deletingPart)}
        title="Hapus Suku Cadang"
        description={`Apakah Anda yakin ingin menghapus suku cadang "${deletingPart?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  )
}
