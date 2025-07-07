"use client"

import { useState, useEffect } from "react"
import { Bell, User, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface HeaderProps {
  title: string
  showMobileMenuButton?: boolean
  onMobileMenuClick?: () => void
}

export function Header({ title, showMobileMenuButton = false, onMobileMenuClick }: HeaderProps) {
  const [user, setUser] = useState<any>(null)
  const [notificationCount, setNotificationCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (typeof window === "undefined") return

    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }

    // Fetch notification count
    fetchNotificationCount()

    // Listen for notification read events
    const handleNotificationRead = () => {
      fetchNotificationCount()
    }

    window.addEventListener("notificationRead", handleNotificationRead)

    return () => {
      window.removeEventListener("notificationRead", handleNotificationRead)
    }
  }, [])

  const fetchNotificationCount = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("/api/notifications/count", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setNotificationCount(data.count || 0)
      }
    } catch (error) {
      console.error("Error fetching notification count:", error)
    }
  }

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
  }

  const handleNotificationClick = () => {
    router.push("/notifications")
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile menu button - hanya tampil di mobile */}
          {showMobileMenuButton && (
            <Button variant="ghost" size="icon" className="md:hidden" onClick={onMobileMenuClick}>
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative" onClick={handleNotificationClick}>
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {notificationCount > 99 ? "99+" : notificationCount}
              </Badge>
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span className="hidden md:block">{user?.full_name || "User"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <Badge variant="secondary" className="w-fit text-xs">
                    {user?.role?.toUpperCase()}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profil</DropdownMenuItem>
              <DropdownMenuItem>Pengaturan</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
