"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Ticket,
  CheckCircle,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  List,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "My Tickets", href: "/admin/dashboard", icon: Ticket },
  { name: "All Tickets", href: "/admin/dashboard/tickets", icon: List },
  { name: "Resolved", href: "/admin/resolved", icon: CheckCircle },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const pathname = usePathname()

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      localStorage.removeItem("auth-token")
      window.location.href = "/admin/login"
    }
  }

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
      )}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
        <div className={cn("flex items-center", isCollapsed && "justify-center")}>
          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white font-bold text-sm">
            T
          </div>
          {!isCollapsed && <span className="ml-2 text-lg font-semibold text-gray-900">TicketDesk</span>}
        </div>
        {!isCollapsed && (
          <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(true)} className="h-6 w-6 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                isCollapsed && "justify-center",
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500",
                  !isCollapsed && "mr-3",
                )}
              />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
              {isCollapsed && (
                <span className="absolute left-16 ml-2 rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  {item.name}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-2">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start text-gray-600 hover:bg-gray-50 hover:text-gray-900",
            isCollapsed && "justify-center px-2",
          )}
        >
          <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
          {!isCollapsed && "Sign out"}
          {isCollapsed && (
            <span className="absolute left-16 ml-2 rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
              Sign out
            </span>
          )}
        </Button>
      </div>

      {/* Expand button when collapsed */}
      {isCollapsed && (
        <div className="absolute -right-3 top-1/2 transform -translate-y-1/2">
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0 bg-white border-gray-200 shadow-sm"
            onClick={() => setIsCollapsed(false)}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}
