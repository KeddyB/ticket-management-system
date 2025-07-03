"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LayoutDashboard, Ticket, Users, CreditCard, Settings, Edit, Trash2, UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Admin {
  id: number
  email: string
  name: string
  role: string
  category_id: number
  category_name: string
  is_active: boolean
  created_at: string
}

interface Category {
  id: number
  name: string
  description: string
  color: string
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    category_id: "",
    role: "admin",
    is_active: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
    fetchAdmins()
    fetchCategories()
  }, [])

  const checkAuth = async () => {
    try {
      console.log("Admin Users: Checking authentication...")

      // Get token from localStorage first, then cookie
      let token = localStorage.getItem("auth-token")

      if (!token) {
        // Try to get from cookie as fallback
        const cookies = document.cookie.split(";")
        const authCookie = cookies.find((cookie) => cookie.trim().startsWith("auth-token="))
        if (authCookie) {
          token = authCookie.split("=")[1]
          // Store in localStorage for consistency
          localStorage.setItem("auth-token", token)
        }
      }

      console.log("Admin Users: Token present:", !!token)

      if (!token) {
        console.log("Admin Users: No token found, redirecting to login")
        router.push("/admin/login")
        return
      }

      const response = await fetch("/api/auth/me", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Admin Users: Auth response:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Admin Users: Auth successful for:", data.admin.email)
        setCurrentAdmin(data.admin)
      } else {
        console.log("Admin Users: Auth failed, clearing tokens and redirecting")
        localStorage.removeItem("auth-token")
        document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        router.push("/admin/login")
      }
    } catch (error) {
      console.error("Admin Users: Auth check error:", error)
      localStorage.removeItem("auth-token")
      document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      router.push("/admin/login")
    }
  }

  const getAuthHeaders = () => {
    const token = localStorage.getItem("auth-token")
    return token
      ? {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      : {
          "Content-Type": "application/json",
        }
  }

  const fetchAdmins = async () => {
    try {
      console.log("Admin Users: Fetching admins...")
      const response = await fetch("/api/admins", {
        headers: getAuthHeaders(),
      })

      console.log("Admin Users: Fetch admins response:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Admin Users: Fetched", data.length, "admins")
        setAdmins(data)
      } else if (response.status === 401) {
        console.log("Admin Users: Unauthorized, redirecting to login")
        localStorage.removeItem("auth-token")
        document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        router.push("/admin/login")
      } else {
        const errorData = await response.json()
        console.error("Admin Users: Fetch failed:", errorData)
        toast({
          title: "Error",
          description: errorData.error || "Failed to fetch admins",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Admin Users: Fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to fetch admins",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      const data = await response.json()
      if (Array.isArray(data)) {
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const handleCreateAdmin = async () => {
    try {
      const response = await fetch("/api/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          category_id: Number.parseInt(formData.category_id),
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Admin created successfully",
        })
        setIsCreateModalOpen(false)
        setFormData({
          email: "",
          password: "",
          name: "",
          category_id: "",
          role: "admin",
          is_active: true,
        })
        fetchAdmins()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create admin",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create admin",
        variant: "destructive",
      })
    }
  }

  const handleEditAdmin = async () => {
    if (!editingAdmin) return

    try {
      const response = await fetch(`/api/admins/${editingAdmin.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          category_id: Number.parseInt(formData.category_id),
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Admin updated successfully",
        })
        setIsEditModalOpen(false)
        setEditingAdmin(null)
        fetchAdmins()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update admin",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update admin",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAdmin = async (adminId: number) => {
    if (!confirm("Are you sure you want to delete this admin?")) return

    try {
      const response = await fetch(`/api/admins/${adminId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Admin deleted successfully",
        })
        fetchAdmins()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete admin",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete admin",
        variant: "destructive",
      })
    }
  }

  const openEditModal = (admin: Admin) => {
    setEditingAdmin(admin)
    setFormData({
      email: admin.email,
      password: "",
      name: admin.name,
      category_id: admin.category_id.toString(),
      role: admin.role,
      is_active: admin.is_active,
    })
    setIsEditModalOpen(true)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading admin users...</p>
        </div>
      </div>
    )
  }

  if (!currentAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Authenticating...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
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
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Akulaku</h1>
              <p className="text-sm text-gray-500">PayLater</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <a
            href="/admin/dashboard"
            className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </a>
          <a
            href="/admin/dashboard"
            className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Ticket className="w-5 h-5" />
            <span>All Tickets</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-5 h-5" />
            <span>Admin Users</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <CreditCard className="w-5 h-5" />
            <span>Payments</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Admin Users</h1>
              <p className="text-sm text-gray-500">Manage admin accounts and permissions</p>
            </div>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarFallback>{currentAdmin ? getInitials(currentAdmin.name) : "A"}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{currentAdmin?.name || "Admin"}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Admin Users ({admins.length})</CardTitle>
                  <CardDescription>Manage admin accounts and their category assignments</CardDescription>
                </div>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Admin</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Enter password"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={formData.category_id}
                          onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) => setFormData({ ...formData, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateAdmin}>Create Admin</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(admin.name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{admin.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{admin.category_name || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={admin.role === "super_admin" ? "default" : "secondary"}>
                          {admin.role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={admin.is_active ? "default" : "destructive"}>
                          {admin.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(admin.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(admin)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          {currentAdmin?.id !== admin.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAdmin(admin.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditAdmin}>Update Admin</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
