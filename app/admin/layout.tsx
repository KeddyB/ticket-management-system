"use client"

import type React from "react"

// Removed AdminSidebar import

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* AdminSidebar removed from here */}
      <div className="flex-1">
        {" "}
        {/* Removed pl-16 and transition classes */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
