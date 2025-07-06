"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Paperclip, Download, FileText, ImageIcon, X, Upload, ArrowLeft, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CustomerTicketSkeleton } from "@/components/loading-skeletons"

interface Message {
  id: number
  comment: string
  admin_name: string | null
  admin_email: string | null
  admin_id: number | null
  is_internal: boolean
  attachments: Array<{
    id: string
    name: string
    type: string
    size: number
    url: string
  }>
  created_at: string
  sender_type: "admin" | "customer"
}

interface TicketData {
  id: string
  title: string
  description: string
  customer_name: string
  customer_email: string
  customer_phone: string
  status: string
  priority: string
  category_name: string
  category_color: string
  assigned_admin_name: string
  created_at: string
  updated_at: string
}

export default function CustomerTicketPage() {
  const params = useParams()
  const ticketId = params.id as string
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [attachments, setAttachments] = useState<
    Array<{
      id: string
      name: string
      type: string
      size: number
      url: string
    }>
  >([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (ticketId) {
      fetchTicket()
      fetchMessages()
      // Poll for new messages every 10 seconds
      const interval = setInterval(fetchMessages, 10000)
      return () => clearInterval(interval)
    }
  }, [ticketId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchTicket = async () => {
    try {
      setError(null)
      console.log("Customer: Fetching ticket:", ticketId)

      const response = await fetch(`/api/tickets/customer/${ticketId}`)
      if (response.ok) {
        const data = await response.json()
        console.log("Customer: Ticket data:", data)
        setTicket(data)
      } else {
        const errorData = await response.json()
        console.error("Customer: Failed to fetch ticket:", response.status, errorData)
        setError("Ticket not found")
        toast({
          title: "Error",
          description: "Ticket not found",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Customer: Error fetching ticket:", error)
      setError("Failed to load ticket")
      toast({
        title: "Error",
        description: "Failed to load ticket",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      console.log("Customer: Fetching messages for ticket:", ticketId)

      const response = await fetch(`/api/tickets/customer/${ticketId}/messages`)
      if (response.ok) {
        const data = await response.json()
        console.log("Customer: Messages data:", data.length, "messages")
        setMessages(data)
      } else {
        const errorData = await response.json()
        console.error("Customer: Failed to fetch messages:", response.status, errorData)
        // Don't show error toast for messages, just log it
      }
    } catch (error) {
      console.error("Customer: Error fetching messages:", error)
      // Don't show error toast for messages, just log it
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload/customer", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const fileData = await response.json()
        setAttachments([...attachments, fileData])
        toast({
          title: "File uploaded",
          description: `${file.name} uploaded successfully`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Upload failed",
          description: error.error || "Failed to upload file",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeAttachment = (attachmentId: string) => {
    setAttachments(attachments.filter((att) => att.id !== attachmentId))
  }

  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return

    setIsSending(true)
    const messageToSend = newMessage.trim()
    const attachmentsToSend = [...attachments]

    // Clear inputs immediately
    setNewMessage("")
    setAttachments([])

    try {
      console.log("Customer: Sending message:", messageToSend.substring(0, 50) + "...")

      const response = await fetch(`/api/tickets/customer/${ticketId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageToSend,
          customer_name: ticket?.customer_name,
          customer_email: ticket?.customer_email,
          attachments: attachmentsToSend,
        }),
      })

      if (response.ok) {
        const newMsg = await response.json()
        console.log("Customer: Message sent successfully:", newMsg.id)

        // Add message to list immediately
        setMessages((prev) => [...prev, newMsg])

        // Refresh messages after a short delay to get any automated responses
        setTimeout(fetchMessages, 1000)

        toast({
          title: "Message sent",
          description: "Your message has been sent to our support team",
        })
      } else {
        const error = await response.json()
        console.error("Customer: Failed to send message:", error)

        // Restore inputs on failure
        setNewMessage(messageToSend)
        setAttachments(attachmentsToSend)

        toast({
          title: "Failed to send",
          description: error.error || "Failed to send message",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Customer: Error sending message:", error)

      // Restore inputs on network error
      setNewMessage(messageToSend)
      setAttachments(attachmentsToSend)

      toast({
        title: "Failed to send",
        description: "An error occurred while sending the message",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "text-blue-600 bg-blue-50"
      case "in_progress":
        return "text-orange-600 bg-orange-50"
      case "closed":
        return "text-gray-600 bg-gray-50"
      case "resolved":
        return "text-green-600 bg-green-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50"
      case "medium":
        return "text-yellow-600 bg-yellow-50"
      case "low":
        return "text-green-600 bg-green-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  if (isLoading) {
    return <CustomerTicketSkeleton />
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ticket Not Found</h1>
          <p className="text-gray-600 mb-4">The ticket you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <a href="/">Submit New Ticket</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <a href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Support Center
                </a>
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Ticket #{ticket.id}</h1>
                <p className="text-sm text-gray-500">{ticket.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`${getStatusColor(ticket.status)}`}>{ticket.status.replace("_", " ")}</Badge>
              <Badge className={`${getPriorityColor(ticket.priority)}`}>{ticket.priority}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Ticket Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge className={`${getStatusColor(ticket.status)} mt-1`}>{ticket.status.replace("_", " ")}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Priority</p>
                  <Badge className={`${getPriorityColor(ticket.priority)} mt-1`}>{ticket.priority}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p className="text-sm text-gray-900">{ticket.category_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="text-sm text-gray-900">{new Date(ticket.created_at).toLocaleString()}</p>
                </div>
                {ticket.assigned_admin_name && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Assigned to</p>
                    <p className="text-sm text-gray-900">{ticket.assigned_admin_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Original Request</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">{ticket.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversation */}
          <div className="lg:col-span-3">
            <Card className="h-[700px] flex flex-col">
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
                <p className="text-sm text-gray-500">
                  Chat with our support team about your ticket. We'll respond as soon as possible.
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium mb-2">We've received your ticket!</p>
                      <p>A support representative will respond shortly. Feel free to add more details below.</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="flex space-x-3">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="text-sm">
                            {message.admin_name ? getInitials(message.admin_name) : getInitials(ticket.customer_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 max-w-[calc(100%-3rem)]">
                          <div className="flex items-center space-x-2 mb-1 flex-wrap">
                            <span className="font-medium text-sm">{message.admin_name || ticket.customer_name}</span>
                            {message.admin_name && (
                              <Badge variant="secondary" className="text-xs">
                                Support Team
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(message.created_at).toLocaleString()}
                            </span>
                          </div>
                          {message.comment && (
                            <div
                              className={`rounded-lg p-3 mb-2 break-words overflow-wrap-anywhere ${message.admin_name ? "bg-blue-50" : "bg-gray-50"}`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                                {message.comment}
                              </p>
                            </div>
                          )}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="space-y-2">
                              {message.attachments.map((attachment) => (
                                <Card key={attachment.id} className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                                      {getFileIcon(attachment.type)}
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium truncate">{attachment.name}</p>
                                        <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                                      </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="flex-shrink-0">
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 p-4 bg-white">
                  {/* Attachments Preview */}
                  {attachments.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            {getFileIcon(attachment.type)}
                            <span className="text-sm truncate">{attachment.name}</span>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              ({formatFileSize(attachment.size)})
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(attachment.id)}
                            className="flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="text-sm">{getInitials(ticket.customer_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows={3}
                        className="resize-none"
                        disabled={isSending}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
                            title="Upload file"
                            placeholder="Upload file"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <Upload className="w-4 h-4 animate-spin" />
                            ) : (
                              <Paperclip className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          onClick={sendMessage}
                          disabled={isSending || (!newMessage.trim() && attachments.length === 0)}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {isSending ? "Sending..." : "Send"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
