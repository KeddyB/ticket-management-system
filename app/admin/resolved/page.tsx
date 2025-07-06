"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Filter, Calendar, CheckCircle, Clock, LogOut, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AdminSidebar } from "@/components/admin-sidebar"
import { TicketListSkeleton } from "@/components/loading-skeletons"

interface TicketData {
  id: number
  title: string
  description: string
  customer_name: string
  customer_email: string
  customer_phone: string
  status: string
  priority: string
  category_name: string
  category_color: string
  assigned_admin_name: string
  created_at: string
  updated_at: string
  resolved_at: string
}

interface Admin {
  id: number
  email: string
  name: string
  role: string
  category_id: number
}

export default function ResolvedTicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null)
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAuthAndFetchTickets()
  }, [])

  const checkAuthAndFetchTickets = async () => {
    try {
      const authResponse = await fetch("/api/auth/me")
      if (authResponse.ok) {
        const data = await authResponse.json()
        setAdmin(data.admin)
        fetchResolvedTickets()
      } else {
        localStorage.removeItem("auth-token")
        router.push("/admin/login")
      }
    } catch (error) {
      console.error("Auth check error:", error)
      localStorage.removeItem("auth-token")
      router.push("/admin/login")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchResolvedTickets = async () => {
    try {
      const response = await fetch("/api/tickets/resolved")
      if (response.ok) {
        const data = await response.json()
        setTickets(data)
      } else if (response.status === 401) {
        localStorage.removeItem("auth-token")
        router.push("/admin/login")
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch resolved tickets",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch resolved tickets",
        variant: "destructive",
      })
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("auth-token")
      document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      router.push("/admin/login")
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50"
      case "medium":
        return "text-yellow-600 bg-yellow-50"
      case "low":
        return "text-green-600 bg-green-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "closed":
        return "text-gray-600 bg-gray-50"
      case "resolved":
        return "text-green-600 bg-green-50"
      default:
        return "text-blue-600 bg-blue-50"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customer_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col pl-16 transition-all duration-300">
          {/* Header skeleton */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-1">
                  <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Search skeleton */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Content skeleton */}
          <div className="flex-1 flex">
            <div className="w-1/2 bg-white border-r border-gray-200">
              <TicketListSkeleton />
            </div>
            <div className="w-1/2 bg-white flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto animate-pulse"></div>
                <div className="h-4 w-48 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      {/* Main Content */}
      <div className="flex-1 flex flex-col pl-16 transition-all duration-300">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/admin/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Resolved Tickets</h1>
                <p className="text-sm text-gray-500">View completed and closed tickets</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarFallback>{admin ? getInitials(admin.name) : "A"}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{admin?.name || "Admin"}</span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
        {/* Search and Filters */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search resolved tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Date Range
            </Button>
          </div>
        </div>
        {/* Content Area */}
        <div className="flex-1 flex">
          {/* Ticket List */}
          <div className="w-1/2 bg-white border-r border-gray-200">
            {filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <CheckCircle className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Resolved Tickets</h3>
                <p className="text-gray-500 text-center max-w-md">
                  Resolved and closed tickets will appear here. Great job keeping up with support!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedTicket?.id === ticket.id ? "bg-blue-50 border-r-2 border-blue-600" : ""
                    }`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900">{ticket.title}</h3>
                          <Badge className={`text-xs ${getStatusColor(ticket.status)}`}>{ticket.status}</Badge>
                          <Badge className={`text-xs ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{ticket.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Customer: {ticket.customer_name}</span>
                          <span>Category: {ticket.category_name}</span>
                          {ticket.assigned_admin_name && <span>Handled by: {ticket.assigned_admin_name}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">#{ticket.id}</p>
                        <p className="text-xs text-gray-500">
                          Resolved: {new Date(ticket.resolved_at || ticket.updated_at).toLocaleDateString()}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {Math.ceil(
                            (new Date(ticket.resolved_at || ticket.updated_at).getTime() -
                              new Date(ticket.created_at).getTime()) /
                              (1000 * 60 * 60 * 24),
                          )}{" "}
                          days
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticket Details */}
          <div className="w-1/2 bg-white">
            {selectedTicket ? (
              <div className="h-full flex flex-col">
                {/* Ticket Header */}
                <div className="border-b border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-sm">{getInitials(selectedTicket.customer_name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{selectedTicket.customer_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">#{selectedTicket.id}</span>
                      <Badge className={`${getStatusColor(selectedTicket.status)}`}>{selectedTicket.status}</Badge>
                      <Badge className={`${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </Badge>
                    </div>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">{selectedTicket.title}</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p>
                        <strong>Created:</strong> {new Date(selectedTicket.created_at).toLocaleString()}
                      </p>
                      <p>
                        <strong>Category:</strong> {selectedTicket.category_name}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Resolved:</strong>{" "}
                        {new Date(selectedTicket.resolved_at || selectedTicket.updated_at).toLocaleString()}
                      </p>
                      {selectedTicket.assigned_admin_name && (
                        <p>
                          <strong>Handled by:</strong> {selectedTicket.assigned_admin_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ticket Content */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Original Request</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                    </CardContent>
                  </Card>

                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-base">Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p>
                        <strong>Email:</strong> {selectedTicket.customer_email}
                      </p>
                      {selectedTicket.customer_phone && (
                        <p>
                          <strong>Phone:</strong> {selectedTicket.customer_phone}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-base">Resolution Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Ticket {selectedTicket.status}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        This ticket was successfully {selectedTicket.status.toLowerCase()} on{" "}
                        {new Date(selectedTicket.resolved_at || selectedTicket.updated_at).toLocaleDateString()}.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a resolved ticket to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
