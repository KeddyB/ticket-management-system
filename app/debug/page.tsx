"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DebugData {
  tickets: any[]
  admins: any[]
  categories: any[]
  total_tickets: number
}

export default function DebugPage() {
  const [data, setData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchDebugData()
  }, [])

  const fetchDebugData = async () => {
    try {
      const response = await fetch("/api/debug/tickets")
      if (response.ok) {
        const debugData = await response.json()
        setData(debugData)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to fetch debug data")
      }
    } catch (err) {
      setError("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading debug data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Debug Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Debug Information</h1>
        <p className="text-gray-600">System status and data overview</p>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.tickets.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.admins.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.categories.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Tickets */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tickets</CardTitle>
              <CardDescription>Last 10 tickets in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.tickets.map((ticket) => (
                  <div key={ticket.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">
                          #{ticket.id} {ticket.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{ticket.status}</Badge>
                          <Badge variant="outline">{ticket.priority}</Badge>
                          <span className="text-xs text-gray-500">
                            {ticket.customer_name} • {ticket.category_name}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{new Date(ticket.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Admins List */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.admins.map((admin) => (
                  <div key={admin.id} className="border rounded p-3">
                    <div className="font-medium">{admin.name}</div>
                    <div className="text-sm text-gray-600">{admin.email}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.categories.map((category) => (
                  <Badge key={category.id} variant="outline">
                    {category.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
