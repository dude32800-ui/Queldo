'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Trash2, Download, Undo2, Redo2, Palette, Minus, Circle, Square, Type } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { io, Socket } from 'socket.io-client'

interface WhiteboardProps {
  isOpen: boolean
  onClose: () => void
  otherUserId: number
  otherUserName: string
  conversationId?: number
  isIncoming?: boolean
}

type Tool = 'pen' | 'eraser' | 'line' | 'circle' | 'rectangle' | 'text'

export default function Whiteboard({ isOpen, onClose, otherUserId, otherUserName, conversationId, isIncoming = false }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentTool, setCurrentTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#9333ea')
  const [lineWidth, setLineWidth] = useState(3)
  const [history, setHistory] = useState<ImageData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [textInput, setTextInput] = useState('')
  const [showTextInput, setShowTextInput] = useState(false)
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 })
  const socketRef = useRef<Socket | null>(null)
  const currentUserIdRef = useRef<number | null>(null)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const roomNameRef = useRef<string | null>(null)

  const colors = [
    '#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
    '#ffffff', '#000000'
  ]

  useEffect(() => {
    if (!isOpen) return

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

    // Initialize Socket.io
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const socket = io(API_URL, {
      auth: { token },
    })
    socketRef.current = socket

    // Create room name from sorted user IDs
    const userIds = currentUserIdRef.current ? [currentUserIdRef.current, otherUserId].sort((a, b) => a - b) : []
    const roomName = userIds.length === 2 ? `whiteboard_${userIds[0]}_${userIds[1]}` : null
    roomNameRef.current = roomName

    socket.on('connect', () => {
      if (roomName) {
        socket.emit('join_whiteboard_room', roomName)
        toast('Whiteboard ready!', { icon: '🎨' })
      }
    })

    // If socket is already connected, join immediately
    if (socket.connected && roomName) {
      socket.emit('join_whiteboard_room', roomName)
      toast('Whiteboard ready!', { icon: '🎨' })
    }

    // Handle remote drawing
    socket.on('whiteboard_draw', (data: { type: string; x: number; y: number; prevX?: number; prevY?: number; color: string; lineWidth: number; tool: string }) => {
      if (!canvasRef.current) return
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      if (data.type === 'start') {
        ctx.beginPath()
        ctx.moveTo(data.x, data.y)
        ctx.strokeStyle = data.tool === 'eraser' ? '#1a1a2e' : data.color
        ctx.lineWidth = data.tool === 'eraser' ? data.lineWidth * 3 : data.lineWidth
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        lastPointRef.current = { x: data.x, y: data.y }
      } else if (data.type === 'draw' && lastPointRef.current) {
        ctx.lineTo(data.x, data.y)
        ctx.stroke()
        lastPointRef.current = { x: data.x, y: data.y }
      } else if (data.type === 'end') {
        lastPointRef.current = null
        saveState()
      }
    })

    socket.on('whiteboard_clear', () => {
      if (!canvasRef.current) return
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      saveState()
      toast(`${otherUserName} cleared the whiteboard`, { icon: '🎨' })
    })

    // Initialize canvas
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const resizeCanvas = () => {
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        saveState()
      }

      resizeCanvas()
      window.addEventListener('resize', resizeCanvas)

      return () => {
        window.removeEventListener('resize', resizeCanvas)
        socket.close()
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [isOpen, conversationId, isIncoming])

  const saveState = () => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(imageData)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return

      setHistoryIndex(historyIndex - 1)
      ctx.putImageData(history[historyIndex - 1], 0, 0)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return

      setHistoryIndex(historyIndex + 1)
      ctx.putImageData(history[historyIndex + 1], 0, 0)
    }
  }

  const clearCanvas = () => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (confirm('Clear the entire whiteboard?')) {
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      saveState()
      
      // Notify other users
      if (socketRef.current && roomNameRef.current) {
        socketRef.current.emit('whiteboard_clear', {
          roomName: roomNameRef.current,
        })
      }
      
      toast.success('Whiteboard cleared')
    }
  }

  const downloadCanvas = () => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = `whiteboard-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
    toast.success('Whiteboard downloaded')
  }

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool === 'text') {
      const { x, y } = getCoordinates(e)
      setTextPosition({ x, y })
      setShowTextInput(true)
      return
    }

    setIsDrawing(true)
    const { x, y } = getCoordinates(e)
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.strokeStyle = currentTool === 'eraser' ? '#1a1a2e' : color
    ctx.lineWidth = currentTool === 'eraser' ? lineWidth * 3 : lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

      // Send drawing start to other users
      if (socketRef.current && roomNameRef.current) {
        socketRef.current.emit('whiteboard_draw', {
          roomName: roomNameRef.current,
          drawingData: {
            type: 'start',
            x,
            y,
            color,
            lineWidth,
            tool: currentTool,
          },
        })
      }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || currentTool === 'text') return

    const { x, y } = getCoordinates(e)
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    if (currentTool === 'pen' || currentTool === 'eraser') {
      ctx.lineTo(x, y)
      ctx.stroke()

      // Send drawing data to other users
      if (socketRef.current && roomNameRef.current && lastPointRef.current) {
        socketRef.current.emit('whiteboard_draw', {
          roomName: roomNameRef.current,
          drawingData: {
            type: 'draw',
            x,
            y,
            prevX: lastPointRef.current.x,
            prevY: lastPointRef.current.y,
            color,
            lineWidth,
            tool: currentTool,
          },
        })
      }
      lastPointRef.current = { x, y }
    }
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      lastPointRef.current = null

      // Send drawing end to other users
      if (socketRef.current && roomNameRef.current) {
        socketRef.current.emit('whiteboard_draw', {
          roomName: roomNameRef.current,
          drawingData: {
            type: 'end',
          },
        })
      }

      saveState()
    }
  }

  const addText = () => {
    if (!textInput.trim()) {
      setShowTextInput(false)
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.fillStyle = color
    ctx.font = `${lineWidth * 5}px Arial`
    ctx.fillText(textInput, textPosition.x, textPosition.y)
    saveState()
    setTextInput('')
    setShowTextInput(false)
    toast.success('Text added')
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
            <h3 className="text-white font-semibold">Whiteboard - {otherUserName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadCanvas}
              className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5 text-gray-400" />
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

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 bg-dark-100 border-b border-primary-500/20 overflow-x-auto">
          {/* Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentTool('pen')}
              className={`p-2 rounded-lg transition-colors ${
                currentTool === 'pen' ? 'bg-primary-600 text-white' : 'bg-dark-200 text-gray-400 hover:bg-dark-300'
              }`}
              title="Pen"
            >
              <Palette className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentTool('eraser')}
              className={`p-2 rounded-lg transition-colors ${
                currentTool === 'eraser' ? 'bg-primary-600 text-white' : 'bg-dark-200 text-gray-400 hover:bg-dark-300'
              }`}
              title="Eraser"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentTool('line')}
              className={`p-2 rounded-lg transition-colors ${
                currentTool === 'line' ? 'bg-primary-600 text-white' : 'bg-dark-200 text-gray-400 hover:bg-dark-300'
              }`}
              title="Line"
            >
              <Minus className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentTool('circle')}
              className={`p-2 rounded-lg transition-colors ${
                currentTool === 'circle' ? 'bg-primary-600 text-white' : 'bg-dark-200 text-gray-400 hover:bg-dark-300'
              }`}
              title="Circle"
            >
              <Circle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentTool('rectangle')}
              className={`p-2 rounded-lg transition-colors ${
                currentTool === 'rectangle' ? 'bg-primary-600 text-white' : 'bg-dark-200 text-gray-400 hover:bg-dark-300'
              }`}
              title="Rectangle"
            >
              <Square className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentTool('text')}
              className={`p-2 rounded-lg transition-colors ${
                currentTool === 'text' ? 'bg-primary-600 text-white' : 'bg-dark-200 text-gray-400 hover:bg-dark-300'
              }`}
              title="Text"
            >
              <Type className="w-5 h-5" />
            </button>
          </div>

          <div className="h-6 w-px bg-primary-500/20" />

          {/* Colors */}
          <div className="flex items-center gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg border-2 transition-all ${
                  color === c ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>

          <div className="h-6 w-px bg-primary-500/20" />

          {/* Line Width */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Size:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-400 w-8">{lineWidth}px</span>
          </div>

          <div className="h-6 w-px bg-primary-500/20" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:bg-dark-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Undo"
            >
              <Undo2 className="w-5 h-5" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:bg-dark-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Redo"
            >
              <Redo2 className="w-5 h-5" />
            </button>
            <button
              onClick={clearCanvas}
              className="p-2 rounded-lg bg-dark-200 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
              title="Clear"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden bg-dark-200">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full h-full cursor-crosshair"
          />
        </div>

        {/* Text Input Modal */}
        <AnimatePresence>
          {showTextInput && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark-100 border border-primary-500/20 rounded-xl p-4 z-50"
              style={{ left: `${textPosition.x}px`, top: `${textPosition.y}px` }}
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addText()
                  } else if (e.key === 'Escape') {
                    setShowTextInput(false)
                    setTextInput('')
                  }
                }}
                autoFocus
                placeholder="Type text..."
                className="px-3 py-2 bg-dark-200 border border-primary-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={addText}
                  className="px-3 py-1 bg-primary-600 hover:bg-primary-700 rounded-lg text-white text-sm"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowTextInput(false)
                    setTextInput('')
                  }}
                  className="px-3 py-1 bg-dark-200 hover:bg-dark-300 rounded-lg text-gray-400 text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}

