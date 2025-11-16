'use client'

import { useState, useEffect, useRef } from 'react'
import { Phone, PhoneOff, Mic, MicOff, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { io, Socket } from 'socket.io-client'

interface VoiceCallProps {
  isOpen: boolean
  onClose: () => void
  otherUserId: number
  otherUserName: string
  conversationId?: number
}

export default function VoiceCall({ 
  isOpen, 
  onClose, 
  otherUserId, 
  otherUserName, 
  conversationId
}: VoiceCallProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting')
  const [callDuration, setCallDuration] = useState(0)
  
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const currentUserIdRef = useRef<number | null>(null)
  const roomNameRef = useRef<string | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isOffererRef = useRef(false)
  const isReadyRef = useRef(false)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isOpen) {
      // Cleanup on close
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }
      return
    }

    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        currentUserIdRef.current = user.id
      } catch (e) {
        console.error('Failed to parse user:', e)
      }
    }

    if (!currentUserIdRef.current) {
      toast.error('Please sign in to start a call')
      onClose()
      return
    }

    // Create room name from sorted user IDs
    const userIds = [currentUserIdRef.current, otherUserId].sort((a, b) => a - b)
    const roomName = `call_voice_${userIds[0]}_${userIds[1]}`
    roomNameRef.current = roomName

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const socket = io(API_URL, {
      auth: { token },
    })
    socketRef.current = socket

    const joinRoom = async () => {
      socket.emit('join_call_room', roomName)
      toast('Joining call room...', { icon: '📞' })
      await initializeCall()
      
      // Also periodically check if we should start (fallback)
      checkIntervalRef.current = setInterval(() => {
        if (socketRef.current && roomNameRef.current) {
          socketRef.current.emit('user_ready_call', roomNameRef.current)
        }
      }, 2000)
      
      // Clear interval after 30 seconds
      setTimeout(() => {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current)
          checkIntervalRef.current = null
        }
      }, 30000)
    }

    socket.on('connect', () => {
      joinRoom()
    })

    socket.on('disconnect', () => {
      // Handle disconnect
    })

    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    // If socket is already connected, join immediately
    if (socket.connected) {
      joinRoom()
    }

    socket.on('both_users_ready', async () => {
      // Wait a bit for peer connection to be ready if it's not yet
      if (!peerConnectionRef.current) {
        setTimeout(() => {
          if (peerConnectionRef.current) {
            handleBothUsersReady()
          } else {
            socket.emit('user_ready_call', roomName)
          }
        }, 1000)
        return
      }

      handleBothUsersReady()
    })

    const handleBothUsersReady = async () => {
      if (!isReadyRef.current && peerConnectionRef.current) {
        isReadyRef.current = true
        if (currentUserIdRef.current && currentUserIdRef.current < otherUserId) {
          isOffererRef.current = true
          try {
            const offer = await peerConnectionRef.current.createOffer()
            await peerConnectionRef.current.setLocalDescription(offer)
            socket.emit('call_offer', { roomName, offer })
            toast('Connecting...', { icon: '📞' })
          } catch (error) {
            console.error('Error creating offer:', error)
          }
        }
      }
    }

    socket.on('waiting_for_user', () => {
      toast('Waiting for other user to join...', { icon: '📞' })
    })

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
    })

    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    socket.on('call_offer', async (data: { offer: RTCSessionDescriptionInit }) => {
      if (peerConnectionRef.current && !peerConnectionRef.current.remoteDescription && !isOffererRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer))
          const answer = await peerConnectionRef.current.createAnswer()
          await peerConnectionRef.current.setLocalDescription(answer)
          socket.emit('call_answer', { roomName, answer })
          toast('Answering call...', { icon: '📞' })
        } catch (error) {
          console.error('Error handling offer:', error)
        }
      }
    })

    socket.on('call_answer', async (data: { answer: RTCSessionDescriptionInit }) => {
      if (peerConnectionRef.current && isOffererRef.current) {
        try {
          if (!peerConnectionRef.current.remoteDescription) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
          }
        } catch (error) {
          console.error('Error handling answer:', error)
        }
      }
    })

    socket.on('call_ice_candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
      }
    })

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }
      if (socketRef.current && roomNameRef.current) {
        socketRef.current.emit('leave_call_room', roomNameRef.current)
      }
      socket.close()
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (callStatus === 'connected' && !durationIntervalRef.current) {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }
    }
  }, [callStatus])

  const initializeCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      })
      setLocalStream(stream)

      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }

      const peerConnection = new RTCPeerConnection(configuration)
      peerConnectionRef.current = peerConnection

      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })

      peerConnection.ontrack = (event) => {
        const remoteStream = event.streams[0]
        setRemoteStream(remoteStream)
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream
        }
        setCallStatus('connected')
        toast.success('Call connected!')
      }

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socketRef.current && roomNameRef.current) {
          socketRef.current.emit('call_ice_candidate', {
            roomName: roomNameRef.current,
            candidate: event.candidate,
          })
        }
      }

      peerConnection.oniceconnectionstatechange = () => {
        // Handle ICE connection state changes
      }

      peerConnection.onconnectionstatechange = () => {
        // Handle connection state changes
      }

      // Signal that we're ready
      if (socketRef.current && roomNameRef.current) {
        socketRef.current.emit('user_ready_call', roomNameRef.current)
      }
    } catch (error: any) {
      console.error('Error initializing call:', error)
      toast.error('Failed to start voice call: ' + (error.message || 'Permission denied'))
      onClose()
    }
  }

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled
        setIsAudioEnabled(!isAudioEnabled)
      }
    }
  }

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
    if (socketRef.current && roomNameRef.current) {
      socketRef.current.emit('leave_call_room', roomNameRef.current)
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
    }
    setCallStatus('ended')
    toast('Call ended', { icon: '📞' })
    setTimeout(() => {
      onClose()
    }, 500)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-dark-50 flex flex-col items-center justify-center"
      >
        <audio ref={remoteAudioRef} autoPlay playsInline />

        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6 shadow-xl"
          >
            {otherUserName.substring(0, 2).toUpperCase()}
          </motion.div>

          <h2 className="text-2xl font-bold text-white mb-2">{otherUserName}</h2>

          <p className="text-gray-400 mb-4">
            {callStatus === 'connecting' && 'Waiting for other user to join...'}
            {callStatus === 'connected' && formatDuration(callDuration)}
            {callStatus === 'ended' && 'Call ended'}
          </p>

          {callStatus === 'connecting' && (
            <p className="text-gray-500 text-sm mb-4">Make sure {otherUserName} also opens the voice call</p>
          )}

          <div className="flex items-center justify-center gap-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleAudio}
              className={`p-4 rounded-full transition-all ${
                isAudioEnabled
                  ? 'bg-dark-200 hover:bg-dark-300 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              title={isAudioEnabled ? 'Mute' : 'Unmute'}
            >
              {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={endCall}
              className="p-4 bg-red-600 hover:bg-red-700 rounded-full text-white transition-all"
              title="End call"
            >
              <PhoneOff className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-dark-200 rounded-lg transition-colors"
          title="Close"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}

