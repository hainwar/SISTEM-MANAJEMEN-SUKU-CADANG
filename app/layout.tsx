import type React from "react"
import "./globals.css"
import ClientLayout from "./clientLayout"
import { Toaster } from "@/components/ui/toaster"

export const metadata = {
  title: "Al-Amin Raoe Motor - Sistem Manajemen Suku Cadang",
  description: "Sistem manajemen inventori suku cadang motor dengan ROP otomatis",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>
        <ClientLayout>{children}</ClientLayout>
        <Toaster />
      </body>
    </html>
  )
}
