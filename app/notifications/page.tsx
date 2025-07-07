"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertTriangle,
  Package,
  RefreshCw,
  Loader2,
  TrendingDown,
  Clock,
  AlertCircle,
  CheckCircle,
  Check,
} from "lucide-react"

interface Notification {
  id: string
  spare_part_id: number
  code: string
  name: string
  current_stock: number
  minimum_stock: number
  rop: number
  category: string
  type: "critical" | "reorder" | "low"
  message: string
  created_at: string
  is_read: boolean
}

interface NotificationStats {
  critical: number
  reorder: number
  low: number
  total: number
  unread: number
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats>({ critical: 0, reorder: 0, low: 0, total: 0, unread: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (typeof window === "undefined") return
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError("")
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setStats(data.stats || { critical: 0, reorder: 0, low: 0, total: 0, unread: 0 })
      } else {
        const errorData = await response.json()
        if (response.status === 401) {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          router.push("/login")
          return
        }
        setError(errorData.error || "Gagal memuat notifikasi")
      }
    } catch (error) {
      console.error("Notifications fetch error:", error)
      setError("Terjadi kesalahan koneksi")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchNotifications()
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === notificationId ? { ...notif, is_read: true } : notif)),
        )

        // Update stats
        setStats((prev) => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
        }))

        // Trigger header notification count update
        window.dispatchEvent(new CustomEvent("notificationUpdate"))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Update local state
        setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })))

        // Update stats
        setStats((prev) => ({
          ...prev,
          unread: 0,
        }))

        // Trigger header notification count update
        window.dispatchEvent(new CustomEvent("notificationUpdate"))
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-4 w-4" />
      case "reorder":
        return <Package className="h-4 w-4" />
      case "low":
        return <TrendingDown className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string, isRead: boolean) => {
    const baseColor = (() => {
      switch (type) {
        case "critical":
          return "border-red-200 text-red-800"
        case "reorder":
          return "border-orange-200 text-orange-800"
        case "low":
          return "border-yellow-200 text-yellow-800"
        default:
          return "border-gray-200 text-gray-800"
      }
    })()

    const bgColor = (() => {
      if (isRead) {
        return "bg-gray-50"
      }
      switch (type) {
        case "critical":
          return "bg-red-50"
        case "reorder":
          return "bg-orange-50"
        case "low":
          return "bg-yellow-50"
        default:
          return "bg-gray-50"
      }
    })()

    return `${bgColor} ${baseColor} ${isRead ? "opacity-75" : ""}`
  }

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "critical":
        return "destructive"
      case "reorder":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Header title="Notifikasi" />
        <div className="px-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Memuat notifikasi...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header title="Notifikasi" />

      <div className="px-6 space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Notifikasi</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stok Kritis</p>
                  <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Perlu Reorder</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.reorder}</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Belum Dibaca</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.unread}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Daftar Notifikasi
                {stats.unread > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {stats.unread} baru
                  </Badge>
                )}
              </CardTitle>
              <div className="flex gap-2">
                {stats.unread > 0 && (
                  <Button variant="outline" size="sm" onClick={markAllAsRead} className="bg-transparent">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Tandai Semua Dibaca
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-transparent"
                >
                  {refreshing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Tidak ada notifikasi</p>
                <p className="text-sm text-gray-500">Semua stok dalam kondisi baik</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border-l-4 ${getNotificationColor(notification.type, notification.is_read)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{notification.name}</h4>
                            <Badge variant={getBadgeVariant(notification.type)} className="text-xs">
                              {notification.type === "critical" && "Kritis"}
                              {notification.type === "reorder" && "Reorder"}
                              {notification.type === "low" && "Rendah"}
                            </Badge>
                            {!notification.is_read && (
                              <Badge variant="destructive" className="text-xs">
                                Baru
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm opacity-90 mb-2">{notification.message}</p>
                          <div className="flex items-center gap-4 text-xs opacity-75">
                            <span>Kode: {notification.code}</span>
                            <span>Stok: {notification.current_stock}</span>
                            <span>Min: {notification.minimum_stock}</span>
                            <span>ROP: {notification.rop}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs opacity-75 text-right">
                          <div className="flex items-center gap-1 mb-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(notification.created_at).toLocaleString("id-ID")}</span>
                          </div>
                          {notification.is_read && (
                            <div className="flex items-center gap-1 text-green-600">
                              <Check className="h-3 w-3" />
                              <span>Dibaca</span>
                            </div>
                          )}
                        </div>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
