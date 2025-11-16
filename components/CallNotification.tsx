'use client'

import { useEffect, useState, useRef } from 'react'
import { Video, Phone, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { io, Socket } from 'socket.io-client'
import VideoCall from './VideoCall'
import VoiceCall from './VoiceCall'
import Whiteboard from './Whiteboard'
import toast from 'react-hot-toast'

export default function CallNotification() {
  const [incomingCall, setIncomingCall] = useState<{
    fromUserId: number
    fromUserName: string
    callType: 'video' | 'voice'
    callId: string
    conversationId?: number
  } | null>(null)
  const [incomingWhiteboard, setIncomingWhiteboard] = useState<{
    fromUserId: number
    fromUserName: string
    conversationId?: number
  } | null>(null)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [showVoiceCall, setShowVoiceCall] = useState(false)
  const [showWhiteboard, setShowWhiteboard] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) return

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const socket = io(API_URL, {
      auth: { token },
    })
    socketRef.current = socket

    // Get current user ID and join user room
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        socket.emit('join_user', user.id)
      } catch (e) {
        console.error('Failed to parse user:', e)
      }
    }

    // Listen for incoming calls
    socket.on('incoming_call', (data: {
      fromUserId: number
      fromUserName: string
      callType: 'video' | 'voice'
      callId: string
      conversationId?: number
    }) => {
      setIncomingCall(data)
      toast(`${data.fromUserName} is calling...`, {
        duration: 10000,
        icon: data.callType === 'video' ? '📹' : '📞',
      })
    })

    // Listen for incoming whiteboard
    socket.on('incoming_whiteboard', (data: {
      fromUserId: number
      fromUserName: string
      conversationId?: number
    }) => {
      setIncomingWhiteboard(data)
      toast(`${data.fromUserName} invited you to a whiteboard session`, {
        duration: 5000,
        icon: '🎨',
        action: {
          label: 'Join',
          onClick: () => {
            setShowWhiteboard(true)
            setIncomingWhiteboard(null)
          },
        },
      })
    })

    return () => {
      socket.close()
    }
  }, [])

  const acceptCall = () => {
    if (!incomingCall) return

    if (incomingCall.callType === 'video') {
      setShowVideoCall(true)
    } else {
      setShowVoiceCall(true)
    }
    setIncomingCall(null)
  }

  const declineCall = () => {
    if (!incomingCall || !socketRef.current) return

    socketRef.current.emit('call_answer', {
      toUserId: incomingCall.fromUserId,
      fromUserId: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}').id : null,
      callId: incomingCall.callId,
      accepted: false,
    })

    setIncomingCall(null)
    toast('Call declined', { icon: '📞' })
  }

  return (
    <>
      {/* Incoming Call Notification */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 right-4 z-[10000] bg-dark-100 border border-primary-500/20 rounded-xl p-4 shadow-xl min-w-[300px]"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {incomingCall.fromUserName.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold">{incomingCall.fromUserName}</h3>
                <p className="text-sm text-gray-400">
                  Incoming {incomingCall.callType === 'video' ? 'video' : 'voice'} call
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={acceptCall}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-all flex items-center justify-center gap-2"
              >
                {incomingCall.callType === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                Accept
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={declineCall}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition-all"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Call */}
      {incomingCall && incomingCall.callType === 'video' && (
        <VideoCall
          isOpen={showVideoCall}
          onClose={() => setShowVideoCall(false)}
          otherUserId={incomingCall.fromUserId}
          otherUserName={incomingCall.fromUserName}
          conversationId={incomingCall.conversationId}
          isIncoming={true}
          callId={incomingCall.callId}
        />
      )}

      {/* Voice Call */}
      {incomingCall && incomingCall.callType === 'voice' && (
        <VoiceCall
          isOpen={showVoiceCall}
          onClose={() => setShowVoiceCall(false)}
          otherUserId={incomingCall.fromUserId}
          otherUserName={incomingCall.fromUserName}
          conversationId={incomingCall.conversationId}
          isIncoming={true}
          callId={incomingCall.callId}
        />
      )}

      {/* Whiteboard */}
      {incomingWhiteboard && (
        <Whiteboard
          isOpen={showWhiteboard}
          onClose={() => {
            setShowWhiteboard(false)
            setIncomingWhiteboard(null)
          }}
          otherUserId={incomingWhiteboard.fromUserId}
          otherUserName={incomingWhiteboard.fromUserName}
          conversationId={incomingWhiteboard.conversationId}
          isIncoming={true}
        />
      )}
    </>
  )
}

