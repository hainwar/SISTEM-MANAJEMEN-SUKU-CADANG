"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Package, AlertTriangle, TrendingDown, DollarSign, ArrowUp, ArrowDown } from "lucide-react"

interface StatsCardsProps {
  stats: {
    total_parts: number
    critical_stock: number
    reorder_point: number
    total_value: number
    today_out: number
    today_in: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const router = useRouter()

  const cards = [
    {
      title: "Total Suku Cadang",
      value: stats.total_parts,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      onClick: () => router.push("/spare-parts"),
    },
    {
      title: "Stok Kritis",
      value: stats.critical_stock,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      onClick: () => router.push("/notifications"),
    },
    {
      title: "Perlu Reorder",
      value: stats.reorder_point,
      icon: TrendingDown,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      onClick: () => router.push("/spare-parts?status=reorder"),
    },
    {
      title: "Nilai Total Stok",
      value: formatCurrency(stats.total_value),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      onClick: () => router.push("/reports?type=value"),
    },
    {
      title: "Keluar Hari Ini",
      value: stats.today_out,
      icon: ArrowUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      onClick: () => router.push("/today-sales"),
    },
    {
      title: "Masuk Hari Ini",
      value: stats.today_in,
      icon: ArrowDown,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      onClick: () => router.push("/stock-movements?type=in"),
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card
            key={index}
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:scale-105 transform"
            onClick={card.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <p className="text-xs text-gray-500 mt-1">Klik untuk detail</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
