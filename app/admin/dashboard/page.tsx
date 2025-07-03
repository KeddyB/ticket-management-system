"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Ticket,
  Users,
  Search,
  Filter,
  Calendar,
  Plus,
  X,
  MoreHorizontal,
  Star,
  LogOut,
  Forward,
  CheckCircle,
  UserCheck,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Conversation } from "@/components/conversation"

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
  assigned_admin_id: number
  created_at: string
  updated_at: string
}

interface Admin {
  id: number
  email: string
  name: string
  role: string
  category_id: number
}

interface AdminUser {
  id: number
  email: string
  name: string
  role: string
  category_id: number
  category_name: string
  category_color: string
  is_active: boolean
}

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null)
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [allAdmins, setAllAdmins] = useState<AdminUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false)
  const [newTicket, setNewTicket] = useState({
    title: "",
    priority: "medium",
    category_id: "",
    description: "",
  })
  const [forwardData, setForwardData] = useState({
    admin_id: "",
    reason: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (admin) {
      fetchTickets()
      fetchAllAdmins()
    }
  }, [admin])

  const getAuthHeaders = () => {
    const token = localStorage.getItem("auth-token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const checkAuth = async () => {
    try {
      console.log("Dashboard: Checking authentication...")

      const token = localStorage.getItem("auth-token")
      console.log("Dashboard: Token in localStorage:", !!token)

      const response = await fetch("/api/auth/me", {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      })

      console.log("Dashboard: Auth check response:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Dashboard: Auth successful for:", data.admin.email)
        setAdmin(data.admin)
        setAuthError("")
      } else {
        const errorData = await response.json()
        console.log("Dashboard: Auth failed:", errorData)
        setAuthError(errorData.error || "Authentication failed")
        localStorage.removeItem("auth-token")
        router.push("/admin/login")
      }
    } catch (error) {
      console.error("Dashboard: Auth check error:", error)
      setAuthError("Network error during authentication")
      localStorage.removeItem("auth-token")
      router.push("/admin/login")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTickets = async () => {
    try {
      console.log("Dashboard: Fetching tickets...")

      const headers = {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      }

      const response = await fetch("/api/tickets", {
        method: "GET",
        headers,
        credentials: "include", // <-- send cookies
      })

      if (response.ok) {
        const data = await response.json()
        // Filter out resolved/closed tickets for the main dashboard
        const activeTickets = data.filter((ticket: TicketData) => !["closed", "resolved"].includes(ticket.status))
        setTickets(activeTickets)
      } else if (response.status === 401) {
        localStorage.removeItem("auth-token")
        router.push("/admin/login")
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch tickets",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Dashboard: Fetch tickets error:", error)
      toast({
        title: "Error",
        description: "Failed to fetch tickets",
        variant: "destructive",
      })
    }
  }

  const fetchAllAdmins = async () => {
    try {
      const response = await fetch("/api/admins/all", {
        headers: getAuthHeaders(),
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setAllAdmins(data)
      }
    } catch (error) {
      console.error("Error fetching admins:", error)
    }
  }

  const handleForwardTicket = async () => {
    if (!selectedTicket || !forwardData.admin_id) return

    try {
      const response = await fetch(`/api/tickets/${selectedTicket.id}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "include",
        body: JSON.stringify({
          assigned_admin_id: Number.parseInt(forwardData.admin_id),
          reason: forwardData.reason,
        }),
      })

      if (response.ok) {
        const updatedTicket = await response.json()
        setTickets(tickets.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)))
        setSelectedTicket(updatedTicket)
        setIsForwardModalOpen(false)
        setForwardData({ admin_id: "", reason: "" })

        const assignedAdmin = allAdmins.find((a) => a.id === Number.parseInt(forwardData.admin_id))
        toast({
          title: "Ticket Forwarded",
          description: `Ticket has been assigned to ${assignedAdmin?.name}`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to forward ticket",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to forward ticket",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTicketStatus = async (status: string) => {
    if (!selectedTicket) return

    try {
      console.log("Updating ticket", selectedTicket.id, "to status:", status)

      const response = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "include", // <-- send cookies
        body: JSON.stringify({
          status,
          priority: selectedTicket.priority,
        }),
      })

      console.log("Update response status:", response.status)

      if (response.ok) {
        const updatedTicket = await response.json()
        console.log("Updated ticket:", updatedTicket)

        if (status === "closed" || status === "resolved") {
          // Remove from active tickets list
          setTickets(tickets.filter((t) => t.id !== updatedTicket.id))
          setSelectedTicket(null)
          toast({
            title: "Ticket " + (status === "closed" ? "Closed" : "Resolved"),
            description: `Ticket #${updatedTicket.id} has been ${status}`,
          })
        } else {
          setTickets(tickets.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)))
          setSelectedTicket(updatedTicket)
          toast({
            title: "Status Updated",
            description: `Ticket marked as ${status.replace("_", " ")}`,
          })
        }
      } else {
        const errorData = await response.json()
        console.error("Update failed:", errorData)
        toast({
          title: "Error",
          description: errorData.error || "Failed to update ticket status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Update error:", error)
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      })
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: getAuthHeaders(),
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("auth-token")
      document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      router.push("/admin/login")
    }
  }

  const handleCreateTicket = async () => {
    try {
      const response = await fetch("/api/tickets/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "include",
        body: JSON.stringify({
          ...newTicket,
          customer_name: admin?.name || "Admin",
          customer_email: admin?.email || "",
          category_id: admin?.category_id || 1,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Ticket created successfully",
        })
        setIsCreateModalOpen(false)
        setNewTicket({ title: "", priority: "medium", category_id: "", description: "" })
        fetchTickets()
      } else if (response.status === 401) {
        localStorage.removeItem("auth-token")
        router.push("/admin/login")
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to create ticket",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      })
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
      case "open":
        return "text-blue-600 bg-blue-50"
      case "in_progress":
        return "text-orange-600 bg-orange-50"
      case "closed":
        return "text-gray-600 bg-gray-50"
      case "resolved":
        return "text-green-600 bg-green-50"
      default:
        return "text-gray-600 bg-gray-50"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
          {authError && <p className="text-red-600 mt-2">{authError}</p>}
        </div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{authError}</p>
          <p className="text-gray-600 mb-4">Redirecting to login...</p>
          <Button onClick={() => router.push("/admin/login")}>Go to Login Now</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Keddy</h1>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center space-x-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
            <Ticket className="w-5 h-5" />
            <span>Active Tickets</span>
          </a>
          <a
            href="/admin/resolved"
            className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Resolved Tickets</span>
          </a>
          <a
            href="/admin/users"
            className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Users className="w-5 h-5" />
            <span>Admin Users</span>
          </a>
        </nav>

        <div className="p-4">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Raise Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  Create New Ticket
                  <Button variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Ticket Name</Label>
                  <Input
                    placeholder="Ticket Name"
                    value={newTicket.title}
                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Priority</Label>
                  <div className="flex space-x-4 mt-2">
                    {["high", "medium", "low"].map((priority) => (
                      <label key={priority} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="priority"
                          value={priority}
                          checked={newTicket.priority === priority}
                          onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                          className="text-blue-600"
                        />
                        <span className="capitalize">{priority}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Enter your message..."
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTicket}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Welcome, {admin?.name || "Admin"}</h1>
              <p className="text-sm text-gray-500">{tickets.length} active tickets</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xs font-medium">1</span>
              </div>
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
                placeholder="Search Ticket Id, Name or Date"
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
              Request Date
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex">
          {/* Ticket List */}
          <div className="w-1/2 bg-white border-r border-gray-200">
            {filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <div className="w-64 h-64 mb-6">
                  <img
                    src="/placeholder.svg?height=256&width=256"
                    alt="No tickets"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                <p className="text-gray-500 text-center max-w-md">
                  No active tickets at the moment. Great job keeping up with support requests!
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
                          <Badge className={`text-xs ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace("_", " ")}
                          </Badge>
                          <Badge className={`text-xs ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{ticket.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Customer: {ticket.customer_name}</span>
                          <span>Category: {ticket.category_name}</span>
                          {ticket.assigned_admin_name && <span>Assigned: {ticket.assigned_admin_name}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Ticket ID: #{ticket.id}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(ticket.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
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
                      <Badge className={`${getStatusColor(selectedTicket.status)}`}>
                        {selectedTicket.status.replace("_", " ")}
                      </Badge>
                      <Badge className={`${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Star className="w-4 h-4" />
                      </Button>
                      <Dialog open={isForwardModalOpen} onOpenChange={setIsForwardModalOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Forward className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Forward Ticket</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Assign to Admin</Label>
                              <Select
                                value={forwardData.admin_id}
                                onValueChange={(value) => setForwardData({ ...forwardData, admin_id: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select admin" />
                                </SelectTrigger>
                                <SelectContent>
                                  {allAdmins
                                    .filter((adminUser) => adminUser.id !== selectedTicket.assigned_admin_id)
                                    .map((adminUser) => (
                                      <SelectItem key={adminUser.id} value={adminUser.id.toString()}>
                                        <div className="flex items-center space-x-2">
                                          <Avatar className="w-6 h-6">
                                            <AvatarFallback className="text-xs">
                                              {getInitials(adminUser.name)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <p className="font-medium">{adminUser.name}</p>
                                            <p className="text-xs text-gray-500">{adminUser.category_name}</p>
                                          </div>
                                        </div>
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Reason for forwarding</Label>
                              <Textarea
                                placeholder="Why are you forwarding this ticket?"
                                value={forwardData.reason}
                                onChange={(e) => setForwardData({ ...forwardData, reason: e.target.value })}
                                rows={3}
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => setIsForwardModalOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleForwardTicket}>Forward Ticket</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedTicket.title}</h2>
                  <p className="text-sm text-gray-500">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                  {selectedTicket.assigned_admin_name && (
                    <div className="flex items-center space-x-2 mt-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Assigned to {selectedTicket.assigned_admin_name}</span>
                    </div>
                  )}
                </div>

                {/* Ticket Content */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>

                  {/* Customer Info */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <strong>Email:</strong> {selectedTicket.customer_email}
                      </p>
                      {selectedTicket.customer_phone && (
                        <p>
                          <strong>Phone:</strong> {selectedTicket.customer_phone}
                        </p>
                      )}
                      <p>
                        <strong>Category:</strong> {selectedTicket.category_name}
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-6 space-y-2">
                    <h4 className="font-medium text-gray-900">Quick Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateTicketStatus("in_progress")}
                        disabled={selectedTicket.status === "in_progress"}
                        className="bg-orange-50 text-orange-600 hover:bg-orange-100"
                      >
                        Mark In Progress
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateTicketStatus("resolved")}
                        disabled={selectedTicket.status === "resolved"}
                        className="bg-green-50 text-green-600 hover:bg-green-100"
                      >
                        Mark Resolved
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateTicketStatus("closed")}
                        disabled={selectedTicket.status === "closed"}
                        className="bg-gray-50 text-gray-600 hover:bg-gray-100"
                      >
                        Close Ticket
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Conversation */}
                <div className="flex-1 flex flex-col min-h-0">
                  <Conversation
                    ticketId={selectedTicket.id}
                    currentAdminId={admin?.id || 0}
                    currentAdminName={admin?.name || "Admin"}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">Select a ticket to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
