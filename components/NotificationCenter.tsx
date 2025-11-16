'use client'

import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { io, Socket } from 'socket.io-client'
import toast from 'react-hot-toast'

interface Notification {
  id: string | number
  type: string
  title: string
  message: string
  link?: string
  read?: boolean
  created_at?: string
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    // Initialize socket connection
    const token = localStorage.getItem('token')
    if (!token) return

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      auth: { token }
    })
    setSocket(newSocket)

    // Get current user ID and join user room
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        newSocket.emit('join_user', user.id)
      } catch (e) {
        console.error('Failed to parse user:', e)
      }
    }

    // Listen for real-time notifications
    newSocket.on('new_notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
      // Show toast notification
      toast.success(notification.message || notification.title, {
        duration: 4000,
        icon: '🔔',
      })
    })

    // Load existing notifications
    fetchNotifications()

    return () => {
      newSocket.close()
    }
  }, [])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.notifications?.filter((n: Notification) => !n.read).length || 0)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/notifications/${id}/read`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-white transition-colors"
      >
        <Image 
          src="/images/3dicons-bell-dynamic-color.png" 
          alt="Notifications" 
          width={20} 
          height={20} 
          className="object-contain"
        />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-primary-500 rounded-full" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-dark-100 border border-primary-500/20 
                     rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden"
          >
            <div className="p-4 border-b border-primary-500/20 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-dark-200 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-80">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-primary-500/20">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 hover:bg-dark-200 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-primary-500/5' : ''
                      }`}
                      onClick={() => {
                        if (!notification.read) markAsRead(notification.id)
                        if (notification.link) window.location.href = notification.link
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="text-white font-semibold text-sm mb-1">
                            {notification.title}
                          </p>
                          <p className="text-gray-400 text-xs mb-2">
                            {notification.message}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead(notification.id)
                            }}
                            className="p-1 hover:bg-dark-300 rounded transition-colors"
                          >
                            <Check className="w-4 h-4 text-primary-400" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

