"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertTriangle, X } from "lucide-react"

interface ImportExcelModalProps {
  isOpen: boolean
  onClose: () => void
  onImportSuccess: (data: any[]) => void
}

export function ImportExcelModal({ isOpen, onClose, onImportSuccess }: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{
    success: number
    errors: Array<{ row: number; message: string }>
    data: any[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = () => {
    // Create Excel template data
    const templateData = [
      {
        kode: "SP001",
        nama: "Oli Mesin Yamalube 10W-40",
        kategori: "Oli & Pelumas",
        brand: "Yamaha",
        harga: 45000,
        stok_awal: 25,
        stok_minimum: 10,
        lead_time: 3,
        lokasi: "Rak A1",
        keterangan: "Oli mesin untuk motor Yamaha",
      },
      {
        kode: "SP002",
        nama: "Kampas Rem Depan Vario 150",
        kategori: "Rem",
        brand: "Honda",
        harga: 85000,
        stok_awal: 8,
        stok_minimum: 5,
        lead_time: 7,
        lokasi: "Rak B2",
        keterangan: "Kampas rem depan original Honda",
      },
    ]

    // Convert to CSV format (Excel compatible)
    const headers = [
      "kode",
      "nama",
      "kategori",
      "brand",
      "harga",
      "stok_awal",
      "stok_minimum",
      "lead_time",
      "lokasi",
      "keterangan",
    ]

    const csvContent = [
      headers.join(","),
      ...templateData.map((row) =>
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
    link.setAttribute("download", "template_suku_cadang.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
      ]

      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith(".csv")) {
        alert("Format file tidak didukung. Gunakan file Excel (.xlsx, .xls) atau CSV (.csv)")
        return
      }

      setFile(selectedFile)
      setResults(null)
    }
  }

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim())
    if (lines.length < 2) throw new Error("File kosong atau tidak valid")

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
      const row: any = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })

      data.push(row)
    }

    return data
  }

  const validateRow = (row: any, index: number) => {
    const errors = []

    if (!row.kode) errors.push(`Baris ${index + 2}: Kode suku cadang wajib diisi`)
    if (!row.nama) errors.push(`Baris ${index + 2}: Nama suku cadang wajib diisi`)
    if (!row.kategori) errors.push(`Baris ${index + 2}: Kategori wajib diisi`)
    if (!row.harga || isNaN(Number(row.harga))) errors.push(`Baris ${index + 2}: Harga harus berupa angka`)
    if (!row.stok_awal || isNaN(Number(row.stok_awal))) errors.push(`Baris ${index + 2}: Stok awal harus berupa angka`)
    if (!row.stok_minimum || isNaN(Number(row.stok_minimum)))
      errors.push(`Baris ${index + 2}: Stok minimum harus berupa angka`)
    if (!row.lead_time || isNaN(Number(row.lead_time))) errors.push(`Baris ${index + 2}: Lead time harus berupa angka`)

    return errors
  }

  const processImport = async () => {
    if (!file) return

    setImporting(true)
    setProgress(0)

    try {
      const text = await file.text()
      const rawData = parseCSV(text)

      setProgress(25)

      const processedData = []
      const allErrors = []

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i]
        const rowErrors = validateRow(row, i)

        if (rowErrors.length > 0) {
          allErrors.push(...rowErrors.map((error) => ({ row: i + 2, message: error })))
        } else {
          // Calculate ROP (Reorder Point)
          const dailyDemand = 1.5 // Default daily demand
          const leadTime = Number(row.lead_time)
          const rop = Math.ceil(dailyDemand * leadTime)

          processedData.push({
            id: Date.now() + i, // Temporary ID
            code: row.kode,
            name: row.nama,
            category: row.kategori,
            brand: row.brand || "",
            price: Number(row.harga),
            current_stock: Number(row.stok_awal),
            minimum_stock: Number(row.stok_minimum),
            lead_time: leadTime,
            rop: rop,
            daily_demand: dailyDemand,
            location: row.lokasi || "",
            description: row.keterangan || "",
            is_active: true,
            created_at: new Date().toISOString(),
          })
        }

        setProgress(25 + (i / rawData.length) * 50)
      }

      setProgress(75)

      // Send to API for actual import
      if (processedData.length > 0) {
        const token = localStorage.getItem("token")
        const importPromises = processedData.map(async (item) => {
          try {
            const response = await fetch("/api/spare-parts", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(item),
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || "Import failed")
            }

            return await response.json()
          } catch (error) {
            throw error
          }
        })

        await Promise.all(importPromises)
      }

      setResults({
        success: processedData.length,
        errors: allErrors,
        data: processedData,
      })

      setProgress(100)

      if (processedData.length > 0) {
        onImportSuccess(processedData)
      }
    } catch (error) {
      console.error("Import error:", error)
      setResults({
        success: 0,
        errors: [{ row: 0, message: `Error: ${error instanceof Error ? error.message : "Unknown error"}` }],
        data: [],
      })
    } finally {
      setImporting(false)
    }
  }

  const resetModal = () => {
    setFile(null)
    setResults(null)
    setProgress(0)
    setImporting(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Import Suku Cadang dari Excel
          </DialogTitle>
          <DialogDescription>
            Upload file Excel atau CSV untuk menambahkan multiple suku cadang sekaligus
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Download Template */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">Download Template Excel</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Download template Excel terlebih dahulu, isi data sesuai format, lalu upload kembali.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 bg-transparent border-blue-300 text-blue-700 hover:bg-blue-100"
                  onClick={downloadTemplate}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Upload File Excel/CSV</Label>
              <div className="flex items-center gap-4">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  disabled={importing}
                  className="flex-1"
                />
                {file && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {file && (
                <p className="text-sm text-gray-600">
                  File terpilih: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Format Requirements */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Format yang Diperlukan:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  • <strong>kode</strong>: Kode unik suku cadang (wajib)
                </p>
                <p>
                  • <strong>nama</strong>: Nama suku cadang (wajib)
                </p>
                <p>
                  • <strong>kategori</strong>: Kategori produk (wajib)
                </p>
                <p>
                  • <strong>brand</strong>: Merek/brand (opsional)
                </p>
                <p>
                  • <strong>harga</strong>: Harga satuan dalam angka (wajib)
                </p>
                <p>
                  • <strong>stok_awal</strong>: Jumlah stok awal (wajib)
                </p>
                <p>
                  • <strong>stok_minimum</strong>: Batas minimum stok (wajib)
                </p>
                <p>
                  • <strong>lead_time</strong>: Waktu tunggu dalam hari (wajib)
                </p>
                <p>
                  • <strong>lokasi</strong>: Lokasi penyimpanan (opsional)
                </p>
                <p>
                  • <strong>keterangan</strong>: Deskripsi produk (opsional)
                </p>
              </div>
            </div>
          </div>

          {/* Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memproses import...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-4">
              {results.success > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-green-700">
                    Berhasil mengimport {results.success} suku cadang
                  </AlertDescription>
                </Alert>
              )}

              {results.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Ditemukan {results.errors.length} error:</p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {results.errors.slice(0, 10).map((error, index) => (
                          <p key={index} className="text-xs">
                            • {error.message}
                          </p>
                        ))}
                        {results.errors.length > 10 && (
                          <p className="text-xs font-medium">... dan {results.errors.length - 10} error lainnya</p>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              {results ? "Tutup" : "Batal"}
            </Button>
            {file && !results && (
              <Button onClick={processImport} disabled={importing}>
                <Upload className="h-4 w-4 mr-2" />
                {importing ? "Memproses..." : "Import Data"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
