"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, MessageSquare, Clock, AlertCircle } from "lucide-react"
import { Conversation } from "@/components/conversation"
import { AdminSidebar } from "@/components/admin-sidebar"
import { DashboardSkeleton } from "@/components/loading-skeletons"
import { useRouter } from "next/navigation"

interface Ticket {
  id: number
  title: string
  description: string
  status: "open" | "in_progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  category: string
  customer_name: string
  customer_email: string
  assigned_admin_id?: number
  assigned_admin_name?: string
  created_at: string
  updated_at: string
}

interface Admin {
  id: number
  name: string
  email: string
}

const statusColors = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
}

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const router = useRouter()

  useEffect(() => {
    checkAuthAndFetchData()
  }, [])

  const checkAuthAndFetchData = async () => {
    try {
      console.log("Dashboard: Checking authentication...")

      // Add Authorization header with token from localStorage as backup
      const token = localStorage.getItem("auth-token")
      const headers: HeadersInit = {}
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const authResponse = await fetch("/api/auth/me", { headers })
      console.log("Dashboard: Auth response status:", authResponse.status)

      if (authResponse.ok) {
        const authData = await authResponse.json()
        console.log("Dashboard: Authentication successful for:", authData.admin?.email)

        // Update localStorage token if provided
        if (authData.token) {
          localStorage.setItem("auth-token", authData.token)
        }

        // Proceed to fetch data
        await Promise.all([fetchTickets(), fetchAdmins()])
      } else {
        console.log("Dashboard: Authentication failed, redirecting to login")
        localStorage.removeItem("auth-token")
        router.push("/admin/login")
      }
    } catch (error) {
      console.error("Dashboard: Auth check error:", error)
      localStorage.removeItem("auth-token")
      router.push("/admin/login")
    } finally {
      setLoading(false)
    }
  }

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const headers: HeadersInit = {}
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch("/api/tickets", { headers })
      if (response.ok) {
        const data = await response.json()
        setTickets(data)
      } else {
        console.error("Failed to fetch tickets:", response.status)
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error)
    }
  }

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const headers: HeadersInit = {}
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch("/api/admins", { headers })
      if (response.ok) {
        const data = await response.json()
        setAdmins(data)
      } else {
        console.error("Failed to fetch admins:", response.status)
      }
    } catch (error) {
      console.error("Failed to fetch admins:", error)
    }
  }

  const updateTicketStatus = async (ticketId: number, status: string) => {
    try {
      const token = localStorage.getItem("auth-token")
      const headers: HeadersInit = { "Content-Type": "application/json" }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        fetchTickets()
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: status as any })
        }
      } else {
        console.error("Failed to update ticket status:", response.status)
      }
    } catch (error) {
      console.error("Failed to update ticket status:", error)
    }
  }

  const assignTicket = async (ticketId: number, adminId: number) => {
    try {
      const token = localStorage.getItem("auth-token")
      const headers: HeadersInit = { "Content-Type": "application/json" }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(`/api/tickets/${ticketId}/assign`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ assigned_admin_id: adminId }),
      })

      if (response.ok) {
        fetchTickets()
      } else {
        console.error("Failed to assign ticket:", response.status)
      }
    } catch (error) {
      console.error("Failed to assign ticket:", error)
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar />
        <div className="flex-1 pl-16 transition-all duration-300">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <DashboardSkeleton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 pl-16 transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Manage and track support tickets</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ticketStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{ticketStats.open}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{ticketStats.inProgress}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <Clock className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{ticketStats.resolved}</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Tickets List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Support Tickets</CardTitle>
                      <CardDescription>Manage and respond to customer inquiries</CardDescription>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search tickets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {filteredTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedTicket?.id === ticket.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                        }`}
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                #{ticket.id} {ticket.title}
                              </h3>
                              <Badge className={statusColors[ticket.status]}>{ticket.status.replace("_", " ")}</Badge>
                              <Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ticket.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{ticket.customer_name}</span>
                              <span>{ticket.category}</span>
                              <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                              {ticket.assigned_admin_name && <span>Assigned to {ticket.assigned_admin_name}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <MessageSquare className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredTickets.length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>No tickets found matching your criteria</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ticket Details */}
            <div className="lg:col-span-2">
              {selectedTicket ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">#{selectedTicket.id}</CardTitle>
                        <CardDescription>{selectedTicket.title}</CardDescription>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge className={statusColors[selectedTicket.status]}>
                        {selectedTicket.status.replace("_", " ")}
                      </Badge>
                      <Badge className={priorityColors[selectedTicket.priority]}>{selectedTicket.priority}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Quick Actions */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select
                        value={selectedTicket.status}
                        onValueChange={(value) => updateTicketStatus(selectedTicket.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Assign to</label>
                      <Select
                        value={selectedTicket.assigned_admin_id?.toString() || ""}
                        onValueChange={(value) => assignTicket(selectedTicket.id, Number.parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select admin" />
                        </SelectTrigger>
                        <SelectContent>
                          {admins.map((admin) => (
                            <SelectItem key={admin.id} value={admin.id.toString()}>
                              {admin.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Customer Info */}
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Customer</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{selectedTicket.customer_name}</p>
                        <p>{selectedTicket.customer_email}</p>
                      </div>
                    </div>

                    {/* Conversation */}
                    <div className="pt-4 border-t">
                      <Conversation ticketId={selectedTicket.id} />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>Select a ticket to view details</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
