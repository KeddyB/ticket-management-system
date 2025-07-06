"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

const demoAccounts = [
  { email: "tech@company.com", name: "Tech Support" },
  { email: "john@company.com", name: "John Smith" },
  { email: "sarah@company.com", name: "Sarah Johnson" },
  { email: "mike@company.com", name: "Mike Wilson" },
]

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok && data.success) {

        // Store token in localStorage as backup
        if (data.token) {
          localStorage.setItem("auth-token", data.token)
        }

        // Small delay to ensure cookie is set
        setTimeout(() => {
          router.push("/admin/dashboard")
        }, 100)
      } else {
        setError(data.error || "Login failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword("admin123")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Sign in to access the admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6">
            <div className="text-sm font-medium text-gray-700 mb-2">Demo Accounts:</div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <Button
                  key={account.email}
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin(account.email)}
                  disabled={loading}
                  className="text-xs"
                >
                  {account.name}
                </Button>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Password for all: <code>admin123</code>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 mb-2">Having login issues?</p>
            <Button asChild variant="link" size="sm">
              <a href="/setup/fix-passwords">Fix Admin Passwords</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
