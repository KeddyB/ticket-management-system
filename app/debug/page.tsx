"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface DebugData {
  tickets: any[]
  categories: any[]
  admins: any[]
  summary: {
    totalTickets: number
    totalCategories: number
    totalAdmins: number
    ticketsByCategory: Record<string, number>
  }
}

export default function DebugPage() {
  const [data, setData] = useState<DebugData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDebugData()
  }, [])

  const fetchDebugData = async () => {
    try {
      const response = await fetch("/api/debug/tickets")
      const debugData = await response.json()
      setData(debugData)
    } catch (error) {
      console.error("Error fetching debug data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading debug data...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Failed to load debug data</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Database Debug Information</h1>
          <div className="space-x-2">
            <Button asChild variant="outline">
              <a href="/admin/login">Admin Login</a>
            </Button>
            <Button asChild>
              <a href="/">Home</a>
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.totalTickets}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.totalCategories}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.totalAdmins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Categories with Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(data.summary.ticketsByCategory).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>All categories in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.categories.map((category) => (
                <div key={category.id} className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                    <h3 className="font-medium">{category.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                  <Badge variant="outline">{data.summary.ticketsByCategory[category.id] || 0} tickets</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Admins */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Users</CardTitle>
            <CardDescription>All admin users and their assigned categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.admins.map((admin) => {
                const category = data.categories.find((c) => c.id === admin.category_id)
                return (
                  <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{admin.name}</h3>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={admin.is_active ? "default" : "destructive"}>
                        {admin.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {category && <p className="text-sm text-gray-600 mt-1">Category: {category.name}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tickets */}
        <Card>
          <CardHeader>
            <CardTitle>All Tickets</CardTitle>
            <CardDescription>Complete list of tickets in the database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.tickets.map((ticket) => (
                <div key={ticket.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{ticket.title}</h3>
                      <p className="text-sm text-gray-600">Customer: {ticket.customer_name}</p>
                      <p className="text-sm text-gray-600">
                        Category: {ticket.category_name} (ID: {ticket.category_id})
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant="outline">ID: {ticket.id}</Badge>
                      <Badge variant={ticket.status === "open" ? "default" : "secondary"}>{ticket.status}</Badge>
                      <Badge
                        variant={
                          ticket.priority === "high"
                            ? "destructive"
                            : ticket.priority === "medium"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {ticket.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
