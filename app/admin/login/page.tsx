"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, ArrowLeft, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log("Attempting login for:", email)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log("Login response:", response.status, data)

      if (response.ok) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.admin.name}!`,
        })

        // Store token in localStorage and cookie manually
        if (data.token) {
          localStorage.setItem("auth-token", data.token)
          // Also set cookie manually via document.cookie as backup
          document.cookie = `auth-token=${data.token}; path=/; max-age=86400; SameSite=Lax`
          console.log("Token stored in localStorage and cookie")
        }

        // Small delay to ensure storage is complete
        setTimeout(() => {
          console.log("Redirecting to dashboard")
          window.location.href = "/admin/dashboard"
        }, 500)
      } else {
        toast({
          title: "Login Failed",
          description: data.error || "Invalid credentials",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to fill demo credentials
  const fillDemoCredentials = (email: string) => {
    setEmail(email)
    setPassword("admin123")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Support Center
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto bg-blue-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>Sign in to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="text-center">
                <Link href="/setup" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700">
                  <Settings className="h-4 w-4 mr-1" />
                  Need to setup demo accounts?
                </Link>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-3">Demo Admin Accounts (click to auto-fill):</p>
                <div className="text-xs space-y-2">
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials("tech@company.com")}
                    className="block w-full text-left p-2 hover:bg-gray-100 rounded"
                  >
                    <div className="font-medium">Tech Support</div>
                    <div className="text-gray-500">tech@company.com</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials("billing@company.com")}
                    className="block w-full text-left p-2 hover:bg-gray-100 rounded"
                  >
                    <div className="font-medium">Billing</div>
                    <div className="text-gray-500">billing@company.com</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials("general@company.com")}
                    className="block w-full text-left p-2 hover:bg-gray-100 rounded"
                  >
                    <div className="font-medium">General</div>
                    <div className="text-gray-500">general@company.com</div>
                  </button>
                  <div className="text-center text-gray-500 mt-2">Password: admin123</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
