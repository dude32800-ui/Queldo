'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, Search, User, ArrowLeft, Video, Phone, Palette } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { io, Socket } from 'socket.io-client'
import VideoCall from '@/components/VideoCall'
import VoiceCall from '@/components/VoiceCall'
import Whiteboard from '@/components/Whiteboard'

interface Conversation {
  id: number
  otherUser: {
    id: number
    name: string
    avatar: string
  }
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
}

interface Message {
  id: number
  senderId: number
  senderName: string
  senderAvatar: string
  content: string
  read: boolean
  createdAt: string
}

export default function ChatPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentUserIdRef = useRef<number | null>(null)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [showVoiceCall, setShowVoiceCall] = useState(false)
  const [showWhiteboard, setShowWhiteboard] = useState(false)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      toast.error('Please sign in to use chat')
      router.push('/login')
      return
    }

    // Check for conversation ID in URL
    const urlParams = new URLSearchParams(window.location.search)
    const conversationId = urlParams.get('conversation')
    if (conversationId) {
      setSelectedConversation(parseInt(conversationId))
    }

    // Get current user ID
    api.getCurrentUser().then(user => {
      currentUserIdRef.current = user.user.id
      
      // Initialize Socket.io connection
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const socket = io(API_URL, {
        auth: { token },
      })
      
      socketRef.current = socket

      socket.on('connect', () => {
        console.log('Connected to chat server')
        if (user.user.id) {
          socket.emit('join_user', user.user.id)
        }
      })

      socket.on('new_message', (message: any) => {
        if (message.conversationId === selectedConversation) {
          // Find sender info from existing messages or use current user
          const existingMessage = messages.find(m => m.senderId === message.senderId)
          setMessages(prev => [...prev, {
            id: message.id,
            senderId: message.senderId,
            senderName: existingMessage?.senderName || (message.senderId === currentUserIdRef.current ? 'You' : 'User'),
            senderAvatar: existingMessage?.senderAvatar || '',
            content: message.content,
            read: false,
            createdAt: message.createdAt,
          }])
        } else {
          // Update conversation list
          fetchConversations()
        }
      })

      socket.on('error', (error: any) => {
        toast.error(error.message || 'Chat error')
      })

      return () => {
        socket.disconnect()
      }
    })

    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
      if (socketRef.current) {
        socketRef.current.emit('join_conversation', selectedConversation)
      }
    }

    return () => {
      if (selectedConversation && socketRef.current) {
        socketRef.current.emit('leave_conversation', selectedConversation)
      }
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await api.getConversations()
      setConversations(response.conversations || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: number) => {
    try {
      const response = await api.getMessages(conversationId.toString())
      setMessages(response.messages || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to load messages')
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !selectedConversation || sending) return

    try {
      setSending(true)
      const content = messageInput.trim()
      setMessageInput('')

      // Optimistically add message
      const tempMessage: Message = {
        id: Date.now(),
        senderId: currentUserIdRef.current || 0,
        senderName: 'You',
        senderAvatar: '',
        content,
        read: false,
        createdAt: new Date().toISOString(),
      }
      setMessages(prev => [...prev, tempMessage])

      // Send via Socket.io (primary method)
      if (socketRef.current) {
        socketRef.current.emit('send_message', {
          conversationId: selectedConversation,
          senderId: currentUserIdRef.current,
          content,
        })
      } else {
        // Fallback to API if socket not connected
        await api.sendMessage(selectedConversation.toString(), content)
        fetchMessages(selectedConversation)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message')
      // Remove optimistic message on error
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedConv = conversations.find(c => c.id === selectedConversation)

  return (
    <div className="min-h-screen bg-dark-50 flex flex-col relative overflow-hidden">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-40 -left-32 w-80 h-80 bg-primary-500/18 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl" />
      </div>
      {/* Topography */}
      <div className="inner-topography-overlay" />

      <Navbar />
      <div className="relative flex-1 flex overflow-hidden pt-20">
        {/* Conversations Sidebar */}
        <div className="w-80 border-r border-primary-500/20 bg-dark-100 flex flex-col">
          <div className="p-4 border-b border-primary-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-primary-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Messages</h1>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
                  </p>
                </div>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-200 border border-primary-500/20 rounded-lg 
                         text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                         focus:ring-primary-500 focus:border-primary-500/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-2" />
                <p className="text-gray-400 text-sm">Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-medium mb-1">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </p>
                <p className="text-gray-500 text-sm">
                  {searchQuery 
                    ? 'Try a different search term' 
                    : 'Start chatting with other students from the marketplace'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-primary-500/10">
                {filteredConversations.map((conversation) => (
                  <motion.button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`w-full p-4 text-left hover:bg-dark-200 transition-colors ${
                      selectedConversation === conversation.id ? 'bg-dark-200' : ''
                    }`}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center 
                                    text-primary-300 font-semibold flex-shrink-0">
                        {conversation.otherUser.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-white font-semibold truncate">
                            {conversation.otherUser.name}
                          </h3>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <p className="text-gray-400 text-sm truncate">
                            {conversation.lastMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation && selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-primary-500/20 bg-dark-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="lg:hidden p-2 hover:bg-dark-200 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center 
                                text-primary-300 font-semibold">
                    {selectedConv.otherUser.avatar}
                  </div>
                  <div>
                    <h2 className="text-white font-semibold">{selectedConv.otherUser.name}</h2>
                    <p className="text-gray-400 text-xs flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Active now
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowVideoCall(true)}
                    className="p-2 hover:bg-primary-500/20 rounded-lg transition-colors"
                    title="Start video call"
                  >
                    <Video className="w-5 h-5 text-primary-400" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowVoiceCall(true)}
                    className="p-2 hover:bg-primary-500/20 rounded-lg transition-colors"
                    title="Start voice call"
                  >
                    <Phone className="w-5 h-5 text-primary-400" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowWhiteboard(true)}
                    className="p-2 hover:bg-primary-500/20 rounded-lg transition-colors"
                    title="Open whiteboard"
                  >
                    <Palette className="w-5 h-5 text-primary-400" />
                  </motion.button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
                {messages.map((message) => {
                  const isOwn = message.senderId === currentUserIdRef.current
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start gap-3 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                        {!isOwn && (
                          <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center 
                                        text-primary-300 text-xs font-semibold flex-shrink-0">
                            {message.senderAvatar || message.senderName.charAt(0)}
                          </div>
                        )}
                        <div className={`rounded-2xl px-4 py-2 ${
                          isOwn
                            ? 'bg-primary-600 text-white'
                            : 'bg-dark-200 text-white'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isOwn ? 'text-primary-200' : 'text-gray-400'
                          }`}>
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
                <div ref={messagesEndRef} className="h-1" />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-primary-500/20 bg-dark-100">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-dark-200 border border-primary-500/20 rounded-lg 
                             text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                             focus:ring-primary-500 focus:border-primary-500/50"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!messageInput.trim() || sending}
                    className="p-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 
                             disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                    title="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No conversation selected</h3>
                <p className="text-gray-400">Select a conversation from the sidebar to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Call */}
      {selectedConv && (
        <VideoCall
          isOpen={showVideoCall}
          onClose={() => setShowVideoCall(false)}
          otherUserId={selectedConv.otherUser.id}
          otherUserName={selectedConv.otherUser.name}
          conversationId={selectedConversation || undefined}
        />
      )}

      {/* Voice Call */}
      {selectedConv && (
        <VoiceCall
          isOpen={showVoiceCall}
          onClose={() => setShowVoiceCall(false)}
          otherUserId={selectedConv.otherUser.id}
          otherUserName={selectedConv.otherUser.name}
          conversationId={selectedConversation || undefined}
        />
      )}

      {/* Whiteboard */}
      {selectedConv && (
        <Whiteboard
          isOpen={showWhiteboard}
          onClose={() => setShowWhiteboard(false)}
          otherUserId={selectedConv.otherUser.id}
          otherUserName={selectedConv.otherUser.name}
          conversationId={selectedConversation || undefined}
        />
      )}
    </div>
  )
}

