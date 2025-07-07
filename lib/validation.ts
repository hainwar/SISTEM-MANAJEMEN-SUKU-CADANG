import { z } from "zod"

// Spare Parts Validation Schema
export const sparePartSchema = z.object({
  code: z
    .string()
    .min(3, "Kode minimal 3 karakter")
    .max(20, "Kode maksimal 20 karakter")
    .regex(/^[A-Z0-9-]+$/, "Kode hanya boleh huruf besar, angka, dan tanda strip"),
  name: z.string().min(3, "Nama minimal 3 karakter").max(200, "Nama maksimal 200 karakter"),
  category: z.string().min(2, "Kategori minimal 2 karakter").max(100, "Kategori maksimal 100 karakter"),
  brand: z.string().max(100, "Brand maksimal 100 karakter").optional(),
  price: z.number().min(0, "Harga tidak boleh negatif").max(999999999, "Harga terlalu besar"),
  current_stock: z.number().int("Stok harus bilangan bulat").min(0, "Stok tidak boleh negatif"),
  minimum_stock: z.number().int("Stok minimum harus bilangan bulat").min(1, "Stok minimum minimal 1"),
  lead_time: z
    .number()
    .int("Lead time harus bilangan bulat")
    .min(1, "Lead time minimal 1 hari")
    .max(365, "Lead time maksimal 365 hari"),
  location: z.string().max(100, "Lokasi maksimal 100 karakter").optional(),
  description: z.string().max(500, "Deskripsi maksimal 500 karakter").optional(),
})

export type SparePartInput = z.infer<typeof sparePartSchema>

// Stock Movement Validation Schema
export const stockMovementSchema = z.object({
  spare_part_id: z.number().int().positive("ID suku cadang harus valid"),
  type: z.enum(["in", "out"], { required_error: "Tipe transaksi harus dipilih" }),
  quantity: z.number().int("Jumlah harus bilangan bulat").positive("Jumlah harus lebih dari 0"),
  reason: z.enum(["purchase", "service", "correction", "damaged", "lost", "return"], {
    required_error: "Alasan harus dipilih",
  }),
  reference_number: z.string().max(100, "Nomor referensi maksimal 100 karakter").optional(),
  supplier: z.string().max(100, "Supplier maksimal 100 karakter").optional(),
  unit_price: z.number().min(0, "Harga satuan tidak boleh negatif").optional(),
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
})

export type StockMovementInput = z.infer<typeof stockMovementSchema>

// User Validation Schema
export const userSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(50, "Username maksimal 50 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
  email: z.string().email("Format email tidak valid").max(100, "Email maksimal 100 karakter"),
  full_name: z.string().min(2, "Nama lengkap minimal 2 karakter").max(100, "Nama lengkap maksimal 100 karakter"),
  role: z.enum(["admin", "gudang", "pimpinan"], {
    required_error: "Role harus dipilih",
  }),
  password: z.string().min(6, "Password minimal 6 karakter").max(100, "Password maksimal 100 karakter"),
})

export type UserInput = z.infer<typeof userSchema>

// Login Validation Schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
})

export type LoginInput = z.infer<typeof loginSchema>

// Validation helper function
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): {
  success: boolean
  data?: T
  errors?: Record<string, string[]>
} {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}
      error.errors.forEach((err) => {
        const path = err.path.join(".")
        if (!errors[path]) errors[path] = []
        errors[path].push(err.message)
      })
      return { success: false, errors }
    }
    return { success: false, errors: { general: ["Validation failed"] } }
  }
}
