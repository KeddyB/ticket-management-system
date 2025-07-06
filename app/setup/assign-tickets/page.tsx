"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Users } from "lucide-react"

export default function AssignTicketsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const assignTickets = async () => {
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/setup/assign-tickets", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || "Assignment failed")
      }
    } catch (err) {
      setError("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Unassigned Tickets
          </CardTitle>
          <CardDescription>Auto-assign tickets that don't have an admin assigned</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={assignTickets} disabled={loading} className="w-full">
            {loading ? "Assigning tickets..." : "Assign Unassigned Tickets"}
          </Button>

          {result && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>{result.message}</p>
                  <div className="bg-gray-100 p-3 rounded text-sm space-y-1">
                    <p>
                      <strong>Total unassigned:</strong> {result.totalUnassigned}
                    </p>
                    <p>
                      <strong>Successfully assigned:</strong> {result.assigned}
                    </p>
                    <p>
                      <strong>Failed to assign:</strong> {result.failed}
                    </p>
                    <p>
                      <strong>Active admins:</strong> {result.activeAdmins}
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-600">
            <p>This will automatically assign unassigned tickets to available admins based on:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Category-specific admins (if available)</li>
              <li>Any active admin (as fallback)</li>
              <li>Random selection for load balancing</li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <Button asChild variant="outline" className="w-full bg-transparent">
              <a href="/admin/dashboard">Go to Admin Dashboard</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
