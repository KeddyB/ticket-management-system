"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const fixDemoAccounts = async () => {
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/setup/fix-demo-accounts", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || "Setup failed")
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
          <CardTitle>Setup Demo Accounts</CardTitle>
          <CardDescription>Fix demo account passwords for testing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={fixDemoAccounts} disabled={loading} className="w-full">
            {loading ? "Setting up..." : "Fix Demo Accounts"}
          </Button>

          {result && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>{result.message}</p>
                  <div className="bg-gray-100 p-3 rounded text-sm">
                    <p>
                      <strong>Email:</strong> {result.credentials.email}
                    </p>
                    <p>
                      <strong>Password:</strong> {result.credentials.password}
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
            <p>This will update the demo accounts with the correct password hash.</p>
            <p className="mt-2">Available demo accounts:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>tech@company.com</li>
              <li>john@company.com</li>
              <li>sarah@company.com</li>
              <li>mike@company.com</li>
            </ul>
            <p className="mt-2">
              Password for all: <code>admin123</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
