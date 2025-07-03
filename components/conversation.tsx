"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Send, Paperclip, Download, FileText, ImageIcon, X, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: number
  comment: string
  admin_name: string
  admin_email: string
  admin_id: number
  is_internal: boolean
  attachments: Array<{
    id: string
    name: string
    type: string
    size: number
    url: string
  }>
  created_at: string
}

interface ConversationProps {
  ticketId: number
  currentAdminId: number
  currentAdminName: string
}

export function Conversation({ ticketId, currentAdminId, currentAdminName }: ConversationProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isInternal, setIsInternal] = useState(false)
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchMessages()
  }, [ticketId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getAuthHeaders = () => {
    const token = localStorage.getItem("auth-token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/messages`, {
        headers: getAuthHeaders(),
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
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

    try {
      const response = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "include",
        body: JSON.stringify({
          message: newMessage,
          is_internal: isInternal,
          attachments: attachments,
        }),
      })

      if (response.ok) {
        setNewMessage("")
        setAttachments([])
        setIsInternal(false)
        fetchMessages()
        toast({
          title: "Message sent",
          description: "Your message has been sent successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Failed to send",
          description: error.error || "Failed to send message",
          variant: "destructive",
        })
      }
    } catch (error) {
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

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-sm">
                  {message.admin_name ? getInitials(message.admin_name) : "C"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-sm">{message.admin_name || "Customer"}</span>
                  <span className="text-xs text-gray-500">{new Date(message.created_at).toLocaleString()}</span>
                  {message.is_internal && (
                    <Badge variant="secondary" className="text-xs">
                      Internal
                    </Badge>
                  )}
                </div>
                {message.comment && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-2">
                    <p className="text-sm whitespace-pre-wrap">{message.comment}</p>
                  </div>
                )}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="space-y-2">
                    {message.attachments.map((attachment) => (
                      <Card key={attachment.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getFileIcon(attachment.type)}
                            <div>
                              <p className="text-sm font-medium">{attachment.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
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
      <div className="border-t border-gray-200 p-4">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-3 space-y-2">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <div className="flex items-center space-x-2">
                  {getFileIcon(attachment.type)}
                  <span className="text-sm">{attachment.name}</span>
                  <span className="text-xs text-gray-500">({formatFileSize(attachment.size)})</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeAttachment(attachment.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-start space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-sm">{getInitials(currentAdminName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={3}
              className="resize-none"
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
                />
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? <Upload className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                </Button>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded"
                  />
                  <span>Internal note</span>
                </label>
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
    </div>
  )
}
