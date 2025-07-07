"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Public routes yang tidak memerlukan authentication
  const publicRoutes = ["/", "/login"]
  const isPublicRoute = publicRoutes.includes(pathname)

  // Load sidebar state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSidebarState = localStorage.getItem("sidebar-collapsed")
      if (savedSidebarState !== null) {
        setSidebarCollapsed(JSON.parse(savedSidebarState))
      }
    }
  }, [])

  // Save sidebar state to localStorage
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(newState))
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false)
      return
    }

    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    // Jika di public route, tidak perlu check authentication
    if (isPublicRoute) {
      setLoading(false)
      return
    }

    // Untuk protected routes, check authentication
    if (!token || !userData) {
      router.push("/login")
      return
    }

    try {
      setUser(JSON.parse(userData))
    } catch (error) {
      router.push("/login")
      return
    }

    setLoading(false)
  }, [pathname, router, isPublicRoute])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Render public routes without sidebar
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Render protected routes with sidebar
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userRole={user?.role || "admin"} isCollapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />
      <main
        className={cn("flex-1 transition-all duration-300 ease-in-out", sidebarCollapsed ? "md:ml-20" : "md:ml-64")}
      >
        {children}
      </main>
    </div>
  )
}
