"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface SparePartFormProps {
  initialData?: any
  onSuccess: () => void
  onCancel: () => void
}

export function SparePartForm({ initialData, onSuccess, onCancel }: SparePartFormProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "",
    brand: "",
    price: "",
    current_stock: "",
    minimum_stock: "",
    lead_time: "",
    location: "",
    description: "",
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const { toast } = useToast()

  const categories = ["Oli & Pelumas", "Rem", "Kelistrikan", "Filter", "Transmisi", "Suspensi", "Body", "Aksesoris"]

  // Pre-fill form when editing
  useEffect(() => {
    if (initialData) {
      console.log("Initial data received:", initialData)
      setFormData({
        code: initialData.code || "",
        name: initialData.name || "",
        category: initialData.category || "",
        brand: initialData.brand || "",
        price: initialData.price?.toString() || "",
        current_stock: initialData.current_stock?.toString() || "",
        minimum_stock: initialData.minimum_stock?.toString() || "",
        lead_time: initialData.lead_time?.toString() || "",
        location: initialData.location || "",
        description: initialData.description || "",
      })
    } else {
      // Reset form for new entry
      setFormData({
        code: "",
        name: "",
        category: "",
        brand: "",
        price: "",
        current_stock: "",
        minimum_stock: "",
        lead_time: "",
        location: "",
        description: "",
      })
    }
    setErrors({})
  }, [initialData])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string[]> = {}

    // Required fields validation
    if (!formData.code.trim()) {
      newErrors.code = ["Kode suku cadang wajib diisi"]
    } else if (formData.code.length < 3) {
      newErrors.code = ["Kode minimal 3 karakter"]
    }

    if (!formData.name.trim()) {
      newErrors.name = ["Nama suku cadang wajib diisi"]
    } else if (formData.name.length < 3) {
      newErrors.name = ["Nama minimal 3 karakter"]
    }

    if (!formData.category) {
      newErrors.category = ["Kategori wajib dipilih"]
    }

    if (!formData.brand.trim()) {
      newErrors.brand = ["Brand wajib diisi"]
    }

    if (!formData.price || Number.parseFloat(formData.price) <= 0) {
      newErrors.price = ["Harga harus lebih dari 0"]
    }

    if (!formData.current_stock || Number.parseInt(formData.current_stock) < 0) {
      newErrors.current_stock = ["Stok saat ini tidak boleh negatif"]
    }

    if (!formData.minimum_stock || Number.parseInt(formData.minimum_stock) <= 0) {
      newErrors.minimum_stock = ["Stok minimum harus lebih dari 0"]
    }

    if (!formData.lead_time || Number.parseInt(formData.lead_time) <= 0) {
      newErrors.lead_time = ["Lead time harus lebih dari 0"]
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Mohon periksa kembali data yang diisi",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      const url = initialData ? `/api/spare-parts/${initialData.id}` : "/api/spare-parts"
      const method = initialData ? "PUT" : "POST"

      const payload = {
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        category: formData.category,
        brand: formData.brand.trim(),
        price: Number.parseFloat(formData.price),
        current_stock: Number.parseInt(formData.current_stock),
        minimum_stock: Number.parseInt(formData.minimum_stock),
        lead_time: Number.parseInt(formData.lead_time),
        location: formData.location.trim(),
        description: formData.description.trim(),
      }

      console.log("Sending payload:", payload)

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        console.log("API Error response:", error)

        if (error.details) {
          setErrors(error.details)
          toast({
            title: "Error",
            description: "Data tidak valid, mohon periksa kembali",
            variant: "destructive",
          })
        } else {
          throw new Error(error.error || "Failed to save spare part")
        }
        return
      }

      const result = await response.json()
      console.log("Success response:", result)

      toast({
        title: "Berhasil",
        description: initialData ? "Suku cadang berhasil diperbarui" : "Suku cadang berhasil ditambahkan",
      })

      onSuccess()
    } catch (error: any) {
      console.error("Error saving spare part:", error)
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan suku cadang",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Kode Suku Cadang *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
            placeholder="Contoh: REM001"
            disabled={!!initialData} // Disable code editing for existing parts
            className={errors.code ? "border-red-500" : ""}
          />
          {errors.code && <p className="text-sm text-red-500">{errors.code[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nama Suku Cadang *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Contoh: Rem Vario Depan"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Kategori *</Label>
          <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
            <SelectTrigger className={errors.category ? "border-red-500" : ""}>
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-sm text-red-500">{errors.category[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand">Brand *</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => handleInputChange("brand", e.target.value)}
            placeholder="Contoh: Honda, Yamaha, Suzuki"
            className={errors.brand ? "border-red-500" : ""}
          />
          {errors.brand && <p className="text-sm text-red-500">{errors.brand[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Harga (Rp) *</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="100"
            value={formData.price}
            onChange={(e) => handleInputChange("price", e.target.value)}
            placeholder="Contoh: 150000"
            className={errors.price ? "border-red-500" : ""}
          />
          {errors.price && <p className="text-sm text-red-500">{errors.price[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="current_stock">Stok Saat Ini *</Label>
          <Input
            id="current_stock"
            type="number"
            min="0"
            value={formData.current_stock}
            onChange={(e) => handleInputChange("current_stock", e.target.value)}
            placeholder="Contoh: 25"
            className={errors.current_stock ? "border-red-500" : ""}
          />
          {errors.current_stock && <p className="text-sm text-red-500">{errors.current_stock[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minimum_stock">Stok Minimum *</Label>
          <Input
            id="minimum_stock"
            type="number"
            min="1"
            value={formData.minimum_stock}
            onChange={(e) => handleInputChange("minimum_stock", e.target.value)}
            placeholder="Contoh: 5"
            className={errors.minimum_stock ? "border-red-500" : ""}
          />
          {errors.minimum_stock && <p className="text-sm text-red-500">{errors.minimum_stock[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lead_time">Lead Time (hari) *</Label>
          <Input
            id="lead_time"
            type="number"
            min="1"
            value={formData.lead_time}
            onChange={(e) => handleInputChange("lead_time", e.target.value)}
            placeholder="Contoh: 7"
            className={errors.lead_time ? "border-red-500" : ""}
          />
          {errors.lead_time && <p className="text-sm text-red-500">{errors.lead_time[0]}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Lokasi Penyimpanan</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => handleInputChange("location", e.target.value)}
          placeholder="Contoh: Rak A1, Gudang Utama"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Deskripsi tambahan tentang suku cadang..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : initialData ? "Update" : "Simpan"}
        </Button>
      </div>
    </form>
  )
}
