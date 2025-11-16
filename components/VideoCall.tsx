'use client'

import { useState, useEffect, useRef } from 'react'
import { Video, VideoOff, Mic, MicOff, X, Maximize2, Minimize2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { io, Socket } from 'socket.io-client'

interface VideoCallProps {
  isOpen: boolean
  onClose: () => void
  otherUserId: number
  otherUserName: string
  conversationId?: number
}

export default function VideoCall({ 
  isOpen, 
  onClose, 
  otherUserId, 
  otherUserName, 
  conversationId
}: VideoCallProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting')
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const currentUserIdRef = useRef<number | null>(null)
  const roomNameRef = useRef<string | null>(null)
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

    // Get current user ID
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
    const roomName = `call_${userIds[0]}_${userIds[1]}`
    roomNameRef.current = roomName

    // Initialize Socket.io connection
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const socket = io(API_URL, {
      auth: { token },
    })
    socketRef.current = socket

    // Set up event listeners BEFORE joining room
    socket.on('both_users_ready', async () => {
      // Wait a bit for peer connection to be ready if it's not yet
      if (!peerConnectionRef.current) {
        setTimeout(() => {
          if (peerConnectionRef.current) {
            handleBothUsersReady()
          } else {
            if (socketRef.current && roomNameRef.current) {
              socketRef.current.emit('user_ready_call', roomNameRef.current)
            }
          }
        }, 1000)
        return
      }

      handleBothUsersReady()
    })

    const handleBothUsersReady = async () => {
      if (!isReadyRef.current && peerConnectionRef.current && roomNameRef.current) {
        isReadyRef.current = true
        // Determine who creates the offer (lower user ID)
        if (currentUserIdRef.current && currentUserIdRef.current < otherUserId) {
          isOffererRef.current = true
          try {
            const offer = await peerConnectionRef.current.createOffer()
            await peerConnectionRef.current.setLocalDescription(offer)
            socketRef.current?.emit('call_offer', { roomName: roomNameRef.current, offer })
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

    // If socket is already connected, join immediately
    if (socket.connected) {
      joinRoom()
    }

    // Handle incoming offer
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

    // Handle incoming answer
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

    // Handle ICE candidates
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
    }
  }, [isOpen])

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Create peer connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }

      const peerConnection = new RTCPeerConnection(configuration)
      peerConnectionRef.current = peerConnection

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        const remoteStream = event.streams[0]
        setRemoteStream(remoteStream)
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream
        }
        setCallStatus('connected')
        toast.success('Call connected!')
      }

      // Handle ICE candidates
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
      toast.error('Failed to start video call: ' + (error.message || 'Permission denied'))
      onClose()
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled
        setIsVideoEnabled(!isVideoEnabled)
      }
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
    setCallStatus('ended')
    toast('Call ended', { icon: '📞' })
    setTimeout(() => {
      onClose()
    }, 500)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-dark-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-dark-100 border-b border-primary-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {otherUserName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-white font-semibold">{otherUserName}</h3>
              <p className="text-sm text-gray-400">
                {callStatus === 'connecting' && 'Connecting...'}
                {callStatus === 'connected' && 'Connected'}
                {callStatus === 'ended' && 'Call ended'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
              title="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5 text-gray-400" /> : <Maximize2 className="w-5 h-5 text-gray-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative bg-black">
          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            style={{ display: remoteStream ? 'block' : 'none' }}
          />

          {/* Local Video (Picture-in-Picture) */}
          {localStream && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute bottom-4 right-4 w-64 h-48 bg-dark-200 rounded-lg overflow-hidden border-2 border-primary-500/50 shadow-xl"
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-dark-200 flex items-center justify-center">
                  <VideoOff className="w-12 h-12 text-gray-600" />
                </div>
              )}
            </motion.div>
          )}

          {/* Connecting/No Remote Video Overlay */}
          {!remoteStream && callStatus === 'connecting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-dark-100">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white font-semibold">Waiting for {otherUserName} to join...</p>
                <p className="text-gray-400 text-sm mt-2">Make sure they also open the video call</p>
              </div>
            </div>
          )}

          {!remoteStream && callStatus === 'connected' && (
            <div className="absolute inset-0 flex items-center justify-center bg-dark-100">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                  {otherUserName.substring(0, 2).toUpperCase()}
                </div>
                <p className="text-white font-semibold">{otherUserName}</p>
                <p className="text-gray-400 text-sm mt-2">Waiting for video...</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 bg-dark-100 border-t border-primary-500/20">
          <div className="flex items-center justify-center gap-4">
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
              <X className="w-6 h-6" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all ${
                isVideoEnabled
                  ? 'bg-dark-200 hover:bg-dark-300 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

