import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

// Update calculateROP function to be more sophisticated
export function calculateROP(dailyDemand: number, leadTime: number): number {
  return Math.ceil(dailyDemand * leadTime)
}

export function getStockStatus(
  currentStock: number,
  rop: number,
  minimumStock: number,
): {
  status: "critical" | "low" | "reorder" | "good"
  color: string
  message: string
} {
  if (currentStock <= minimumStock) {
    return {
      status: "critical",
      color: "text-red-600",
      message: "Stok Kritis",
    }
  } else if (currentStock <= rop) {
    return {
      status: "reorder",
      color: "text-orange-600",
      message: "Perlu Reorder",
    }
  } else if (currentStock <= rop * 1.5) {
    return {
      status: "low",
      color: "text-yellow-600",
      message: "Stok Rendah",
    }
  } else {
    return {
      status: "good",
      color: "text-green-600",
      message: "Stok Aman",
    }
  }
}
