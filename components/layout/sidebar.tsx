"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  ArrowUpDown,
  TrendingUp,
  Bell,
  Settings,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  FileBarChart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarProps {
  userRole: string
  isCollapsed: boolean
  onToggleCollapse: () => void
}

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "gudang", "pimpinan"],
  },
  {
    title: "Suku Cadang",
    href: "/spare-parts",
    icon: Package,
    roles: ["admin", "gudang"],
  },
  {
    title: "Transaksi Stok",
    href: "/stock-movements",
    icon: ArrowUpDown,
    roles: ["admin", "gudang"],
  },
  {
    title: "Penjualan Hari Ini",
    href: "/today-sales",
    icon: BarChart2,
    roles: ["admin", "gudang", "pimpinan"],
  },
  {
    title: "Laporan",
    href: "/reports",
    icon: FileBarChart,
    roles: ["admin", "pimpinan"],
  },
  {
    title: "Notifikasi",
    href: "/notifications",
    icon: Bell,
    roles: ["admin", "gudang", "pimpinan"],
  },
  {
    title: "Pengaturan",
    href: "/settings",
    icon: Settings,
    roles: ["admin"],
  },
]

export function Sidebar({ userRole, isCollapsed, onToggleCollapse }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(userRole))

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login"
  }

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn("p-6 border-b border-gray-200", isCollapsed && "px-4")}>
        {!isCollapsed ? (
          <div>
            <h1 className="text-xl font-bold text-gray-900">Al-Amin Raoe Motor</h1>
            <p className="text-sm text-gray-500 mt-1">Sistem Manajemen Suku Cadang</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
              <Package className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <TooltipProvider>
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-colors w-full",
                  isCollapsed ? "px-3 py-3 justify-center" : "px-3 py-2",
                  isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100",
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                <Icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            )

            if (isCollapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="ml-2">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.href}>{linkContent}</div>
          })}
        </TooltipProvider>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <TooltipProvider>
          {isCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2">
                Keluar
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Keluar
            </Button>
          )}
        </TooltipProvider>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-30 h-full bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out hidden md:block",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        <SidebarContent />

        {/* Toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-6 z-40 bg-white border border-gray-200 rounded-full shadow-md hover:shadow-lg"
          onClick={onToggleCollapse}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </>
  )
}
