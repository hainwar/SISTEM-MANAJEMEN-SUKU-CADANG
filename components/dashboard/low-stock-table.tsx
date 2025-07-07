"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, getStockStatus } from "@/lib/utils"
import { AlertTriangle, Eye } from "lucide-react"

interface LowStockTableProps {
  items: Array<{
    id: number
    code: string
    name: string
    current_stock: number
    minimum_stock: number
    rop: number
    price: number
    location: string
  }>
}

export function LowStockTable({ items }: LowStockTableProps) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Stok Rendah & Perlu Reorder
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => router.push("/notifications")}>
          <Eye className="h-4 w-4 mr-2" />
          Lihat Semua
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Tidak ada item dengan stok rendah</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Kode</th>
                  <th className="text-left py-2">Nama</th>
                  <th className="text-center py-2">Stok</th>
                  <th className="text-center py-2">ROP</th>
                  <th className="text-center py-2">Status</th>
                  <th className="text-left py-2">Lokasi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const status = getStockStatus(item.current_stock, item.rop, item.minimum_stock)
                  return (
                    <tr
                      key={item.id}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/spare-parts?search=${item.code}`)}
                    >
                      <td className="py-2 font-mono text-xs">{item.code}</td>
                      <td className="py-2">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(item.price)}</p>
                        </div>
                      </td>
                      <td className="py-2 text-center">
                        <span className={`font-bold ${status.color}`}>{item.current_stock}</span>
                      </td>
                      <td className="py-2 text-center">{item.rop}</td>
                      <td className="py-2 text-center">
                        <Badge variant={status.status === "critical" ? "destructive" : "secondary"} className="text-xs">
                          {status.message}
                        </Badge>
                      </td>
                      <td className="py-2 text-xs text-gray-500">{item.location}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={() => router.push("/notifications")} className="bg-transparent">
                Lihat Semua Notifikasi Stok
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
