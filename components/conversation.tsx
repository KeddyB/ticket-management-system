"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Paperclip, Download, User, UserCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ConversationSkeleton } from "@/components/loading-skeletons"

interface Message {
  id: number
  ticket_id: string
  admin_id?: number
  comment: string
  attachments: Array<{ name: string; url: string; size: number }>
  created_at: string
  is_internal: boolean
  customer_name?: string
  customer_email?: string
  admin_name?: string
  admin_email?: string
  sender_type: "admin" | "customer"
}

interface ConversationProps {
  ticketId: string | number
  isCustomerView?: boolean
}

export function Conversation({ ticketId, isCustomerView = false }: ConversationProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      setError(null)
      //console.log("Conversation: Fetching messages for ticket:", ticketId, "isCustomerView:", isCustomerView)

      // Use different endpoints for admin vs customer
      const endpoint = isCustomerView
        ? `/api/tickets/customer/${ticketId}/messages`
        : `/api/tickets/${ticketId}/messages`

      //console.log("Conversation: Using endpoint:", endpoint)

      const response = await fetch(endpoint, {
        credentials: "include",
      })

      //console.log("Conversation: Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Conversation: Failed to fetch messages:", response.status, errorData)
        throw new Error(`Failed to fetch messages: ${response.status} - ${errorData.error || "Unknown error"}`)
      }

      const data = await response.json()
      //console.log("Conversation: Fetched messages:", data.length, "messages")
      setMessages(data)
    } catch (error) {
      console.error("Conversation: Error fetching messages:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch messages")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (ticketId) {
      fetchMessages()
      // Poll for new messages every 10 seconds
      const interval = setInterval(fetchMessages, 10000)
      return () => clearInterval(interval)
    }
  }, [ticketId, isCustomerView])

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    const messageToSend = newMessage.trim()

    // Clear the input immediately to provide instant feedback
    setNewMessage("")

    try {
      //console.log("Conversation: Sending message:", messageToSend.substring(0, 50) + "...")

      // Use different endpoints for admin vs customer
      const endpoint = isCustomerView
        ? `/api/tickets/customer/${ticketId}/messages`
        : `/api/tickets/${ticketId}/messages`

      //console.log("Conversation: Sending to endpoint:", endpoint)

      const requestBody = isCustomerView
        ? {
            message: messageToSend,
            attachments: [],
            customer_name: "Customer", // This should be passed from parent component
            customer_email: "customer@example.com", // This should be passed from parent component
          }
        : {
            message: messageToSend,
            attachments: [],
            is_internal: false,
          }

      // console.log("Conversation: Request body:", {
      //   ...requestBody,
      //   message: requestBody.message.substring(0, 50) + "...",
      // })

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      })

      //console.log("Conversation: Send response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Conversation: Failed to send message:", response.status, errorData)

        // Restore the message to input if sending failed
        setNewMessage(messageToSend)

        // Show user-friendly error message
        toast({
          title: "Failed to send message",
          description: errorData.error || "Please try again",
          variant: "destructive",
        })
        return
      }

      const newMsg = await response.json()
      //console.log("Conversation: Message sent successfully:", newMsg.id)

      // Add the new message to the list immediately
      setMessages((prev) => [...prev, newMsg])

      // Show success message
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      })

      // Also refresh messages to get any automated responses
      setTimeout(fetchMessages, 1000)
    } catch (error) {
      console.error("Conversation: Error sending message:", error)

      // Restore the message to input if network error occurred
      setNewMessage(messageToSend)

      toast({
        title: "Network error",
        description: "Failed to send message. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (isLoading) {
    return <ConversationSkeleton />
  }

  return (
    <Card className="w-full border rounded-lg overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Conversation</CardTitle>
        {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
      </CardHeader>
      <CardContent className="p-0 flex flex-col h-[600px]">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">No messages yet</div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender_type === "admin" ? "justify-start" : "justify-end"}`}
              >
                {message.sender_type === "admin" && (
                  <Avatar className="flex-shrink-0 w-8 h-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      <UserCheck className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`flex flex-col max-w-[calc(100%-3rem)] min-w-0 ${
                    message.sender_type === "admin" ? "items-start" : "items-end"
                  }`}
                >
                  <div
                    className={`rounded-lg p-3 break-words overflow-wrap-anywhere ${
                      message.sender_type === "admin"
                        ? "bg-blue-50 text-blue-900 border border-blue-200"
                        : "bg-gray-100 text-gray-900 border border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {message.sender_type === "admin"
                          ? message.admin_name || "Support Team"
                          : message.customer_name || "Customer"}
                      </span>
                      {message.is_internal && (
                        <Badge variant="secondary" className="text-xs">
                          Internal
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm whitespace-pre-wrap break-words">{message.comment}</div>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border text-xs">
                            <Paperclip className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate flex-1 min-w-0">{attachment.name}</span>
                            <span className="text-muted-foreground flex-shrink-0">
                              {formatFileSize(attachment.size)}
                            </span>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 flex-shrink-0">
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{formatDate(message.created_at)}</div>
                </div>

                {message.sender_type === "customer" && (
                  <Avatar className="flex-shrink-0 w-8 h-8">
                    <AvatarFallback className="bg-gray-100 text-gray-600">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {!isCustomerView && (
          <div className="border-t p-4 flex-shrink-0">
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 min-h-[60px] max-h-32 resize-none"
                disabled={isSending}
              />
              <Button onClick={sendMessage} disabled={!newMessage.trim() || isSending} className="self-end">
                <Send className="w-4 h-4" />
                {isSending && <span className="ml-2">Sending...</span>}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
