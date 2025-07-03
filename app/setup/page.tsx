"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [demoAccounts, setDemoAccounts] = useState<Array<{ email: string; password: string }>>([])
  const { toast } = useToast()

  const handleSetup = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/setup/fix-demo-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setDemoAccounts(data.accounts)
        setIsComplete(true)
        toast({
          title: "Setup Complete",
          description: "Demo accounts have been created successfully",
        })
      } else {
        toast({
          title: "Setup Failed",
          description: data.error || "Failed to setup demo accounts",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during setup",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto bg-blue-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
              <Settings className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">System Setup</CardTitle>
            <CardDescription>Initialize the ticket management system with demo accounts and categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isComplete ? (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-yellow-800">Setup Required</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        This will create the necessary categories and demo admin accounts for testing the system. This
                        is safe to run multiple times.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">What will be created:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>5 Support Categories (Technical, Billing, General, Bug Reports, Features)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>5 Demo Admin Accounts with proper authentication</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Automatic ticket routing configuration</span>
                    </li>
                  </ul>
                </div>

                <Button onClick={handleSetup} disabled={isLoading} className="w-full" size="lg">
                  {isLoading ? "Setting up..." : "Initialize System"}
                </Button>
              </>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-green-800">Setup Complete!</h3>
                      <p className="text-sm text-green-700 mt-1">Your ticket management system is now ready to use.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Demo Admin Accounts Created:</h3>
                  <div className="grid gap-3">
                    {demoAccounts.map((account, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">{account.email}</p>
                            <p className="text-sm text-gray-600">Password: {account.password}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(`${account.email}:${account.password}`)
                              toast({
                                title: "Copied",
                                description: "Credentials copied to clipboard",
                              })
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button asChild className="flex-1">
                    <a href="/admin/login">Go to Admin Login</a>
                  </Button>
                  <Button asChild variant="outline" className="flex-1 bg-transparent">
                    <a href="/">Go to Support Center</a>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
