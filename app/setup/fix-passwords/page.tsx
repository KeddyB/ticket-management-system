"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Copy } from "lucide-react"

export default function FixPasswordsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const fixPasswords = async () => {
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/setup/fix-passwords", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || "Setup failed")
        console.error("Setup error details:", data.details)
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Network error:", err)
    } finally {
      setLoading(false)
    }
  }

  const copyCredentials = () => {
    if (result?.testCredentials) {
      navigator.clipboard.writeText(
        `Email: ${result.testCredentials.email}\nPassword: ${result.testCredentials.password}`,
      )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Fix Admin Passwords</CardTitle>
          <CardDescription>Reset admin passwords to fix login issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={fixPasswords} disabled={loading} className="w-full">
            {loading ? "Fixing passwords..." : "Fix Admin Passwords"}
          </Button>

          {result && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>{result.message}</p>
                  <p>Updated {result.updatedRows} admin accounts</p>
                  <div className="bg-gray-100 p-3 rounded text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <strong>Test Credentials:</strong>
                      <Button variant="ghost" size="sm" onClick={copyCredentials}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p>
                      <strong>Email:</strong> {result.testCredentials.email}
                    </p>
                    <p>
                      <strong>Password:</strong> {result.testCredentials.password}
                    </p>
                  </div>
                  {result.availableAccounts && (
                    <div className="text-xs text-gray-600">
                      <p>Available accounts: {result.availableAccounts.join(", ")}</p>
                    </div>
                  )}
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
            <p>
              This will reset all admin passwords to: <code className="bg-gray-100 px-1 rounded">admin123</code>
            </p>
            <p className="mt-2">After fixing, you can login with any of these emails:</p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
              <li>tech@company.com</li>
              <li>john@company.com</li>
              <li>sarah@company.com</li>
              <li>mike@company.com</li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <Button asChild variant="outline" className="w-full bg-transparent">
              <a href="/admin/login">Go to Admin Login</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
