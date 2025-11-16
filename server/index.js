const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
require('dotenv').config()

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/users'))
app.use('/api/listings', require('./routes/listings'))
app.use('/api/matches', require('./routes/matches'))
app.use('/api/notifications', require('./routes/notifications'))
app.use('/api/leaderboard', require('./routes/leaderboard'))
app.use('/api/analytics', require('./routes/analytics'))
app.use('/api/chat', require('./routes/chat'))

// Track call rooms manually
const callRooms = new Map() // roomName -> Set of socket IDs

// Socket.io for real-time notifications and chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`)
    console.log(`User ${userId} joined their room`)
  })

  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`)
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`)
  })

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation_${conversationId}`)
    console.log(`Socket ${socket.id} left conversation ${conversationId}`)
  })

  socket.on('send_message', async (data) => {
    try {
      const { conversationId, senderId, content } = data
      
      // Save message to database
      const { pool } = require('./database/connection')
      const result = await pool.query(`
        INSERT INTO messages (conversation_id, sender_id, content)
        VALUES ($1, $2, $3)
        RETURNING id, created_at
      `, [conversationId, senderId, content])

      // Update conversation updated_at
      await pool.query(`
        UPDATE conversations
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [conversationId])

      const message = {
        id: result.rows[0].id,
        conversationId,
        senderId,
        content,
        createdAt: result.rows[0].created_at,
      }

      // Broadcast to all users in the conversation
      io.to(`conversation_${conversationId}`).emit('new_message', message)
    } catch (error) {
      console.error('Send message error:', error)
      socket.emit('error', { message: 'Failed to send message' })
    }
  })

  // Call room events (simplified - both users join same room)
  const checkRoomAndNotify = (roomName) => {
    // Check both manual tracking and Socket.io adapter
    const manualRoom = callRooms.get(roomName)
    const adapterRoom = io.sockets.adapter.rooms.get(roomName)
    const manualCount = manualRoom ? manualRoom.size : 0
    const adapterCount = adapterRoom ? adapterRoom.size : 0
    
    const userCount = Math.max(manualCount, adapterCount)
    
    if (userCount >= 2) {
      // Both users are in the room, notify both
      io.to(roomName).emit('both_users_ready')
      return true
    } else {
      // First user, wait for second
      return false
    }
  }

  socket.on('join_call_room', (roomName) => {
    socket.join(roomName)
    
    // Track manually
    if (!callRooms.has(roomName)) {
      callRooms.set(roomName, new Set())
    }
    callRooms.get(roomName).add(socket.id)
    
    // Check immediately (synchronous check right after adding)
    const currentRoom = callRooms.get(roomName)
    const manualCount = currentRoom.size
    const adapterRoom = io.sockets.adapter.rooms.get(roomName)
    const adapterCount = adapterRoom ? adapterRoom.size : 0
    
    if (Math.max(manualCount, adapterCount) >= 2) {
      io.to(roomName).emit('both_users_ready')
    }
    
    // Also check asynchronously (fallback)
    setImmediate(() => {
      checkRoomAndNotify(roomName)
    })
    
    setTimeout(() => {
      checkRoomAndNotify(roomName)
    }, 100)
    
    setTimeout(() => {
      checkRoomAndNotify(roomName)
    }, 500)
    
    setTimeout(() => {
      checkRoomAndNotify(roomName)
    }, 1000)
  })

  // Also check when a user signals they're ready
  socket.on('user_ready_call', (roomName) => {
    checkRoomAndNotify(roomName)
  })

  socket.on('leave_call_room', (roomName) => {
    socket.leave(roomName)
    
    // Remove from manual tracking
    if (callRooms.has(roomName)) {
      callRooms.get(roomName).delete(socket.id)
      if (callRooms.get(roomName).size === 0) {
        callRooms.delete(roomName)
      }
    }
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    
    // Clean up manual tracking
    for (const [roomName, socketSet] of callRooms.entries()) {
      if (socketSet.has(socket.id)) {
        socketSet.delete(socket.id)
        if (socketSet.size === 0) {
          callRooms.delete(roomName)
        }
      }
    }
  })

  socket.on('call_offer', (data) => {
    const { roomName, offer } = data
    socket.to(roomName).emit('call_offer', { offer })
  })

  socket.on('call_answer', (data) => {
    const { roomName, answer } = data
    socket.to(roomName).emit('call_answer', { answer })
  })

  socket.on('call_ice_candidate', (data) => {
    const { roomName, candidate } = data
    socket.to(roomName).emit('call_ice_candidate', { candidate })
  })

  // Whiteboard room events (simplified - both users join same room)
  socket.on('join_whiteboard_room', (roomName) => {
    socket.join(roomName)
    console.log(`Socket ${socket.id} joined whiteboard room: ${roomName}`)
  })

  socket.on('whiteboard_draw', (data) => {
    const { roomName, drawingData } = data
    socket.to(roomName).emit('whiteboard_draw', drawingData)
  })

  socket.on('whiteboard_clear', (data) => {
    const { roomName } = data
    socket.to(roomName).emit('whiteboard_clear')
  })

})

// Make io available to routes
app.set('io', io)

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

