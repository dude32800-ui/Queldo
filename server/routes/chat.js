const express = require('express')
const { pool } = require('../database/connection')
const { verifyToken } = require('./auth')

const router = express.Router()

// Get or create conversation between two users
router.get('/conversation/:userId', verifyToken, async (req, res) => {
  try {
    const currentUserId = req.userId
    const otherUserId = parseInt(req.params.userId)

    if (currentUserId === otherUserId) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' })
    }

    // Check if conversation exists
    let result = await pool.query(`
      SELECT id FROM conversations
      WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
    `, [currentUserId, otherUserId])

    let conversationId

    if (result.rows.length === 0) {
      // Create new conversation
      const createResult = await pool.query(`
        INSERT INTO conversations (user1_id, user2_id)
        VALUES ($1, $2)
        RETURNING id
      `, [currentUserId, otherUserId])
      conversationId = createResult.rows[0].id
    } else {
      conversationId = result.rows[0].id
    }

    res.json({ conversationId })
  } catch (error) {
    console.error('Get conversation error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all conversations for current user
router.get('/conversations', verifyToken, async (req, res) => {
  try {
    const userId = req.userId

    const result = await pool.query(`
      SELECT 
        c.id,
        c.updated_at,
        CASE 
          WHEN c.user1_id = $1 THEN c.user2_id
          ELSE c.user1_id
        END as other_user_id,
        CASE 
          WHEN c.user1_id = $1 THEN u2.name
          ELSE u1.name
        END as other_user_name,
        CASE 
          WHEN c.user1_id = $1 THEN u2.avatar
          ELSE u1.avatar
        END as other_user_avatar,
        (
          SELECT content 
          FROM messages 
          WHERE conversation_id = c.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT created_at 
          FROM messages 
          WHERE conversation_id = c.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message_time,
        (
          SELECT COUNT(*) 
          FROM messages 
          WHERE conversation_id = c.id 
            AND sender_id != $1 
            AND read = FALSE
        ) as unread_count
      FROM conversations c
      LEFT JOIN users u1 ON c.user1_id = u1.id
      LEFT JOIN users u2 ON c.user2_id = u2.id
      WHERE c.user1_id = $1 OR c.user2_id = $1
      ORDER BY c.updated_at DESC
    `, [userId])

    const conversations = result.rows.map(row => ({
      id: row.id,
      otherUser: {
        id: row.other_user_id,
        name: row.other_user_name,
        avatar: row.other_user_avatar || row.other_user_name?.substring(0, 2).toUpperCase() || 'U',
      },
      lastMessage: row.last_message,
      lastMessageTime: row.last_message_time,
      unreadCount: parseInt(row.unread_count) || 0,
    }))

    res.json({ conversations })
  } catch (error) {
    console.error('Get conversations error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get messages for a conversation
router.get('/messages/:conversationId', verifyToken, async (req, res) => {
  try {
    const userId = req.userId
    const conversationId = parseInt(req.params.conversationId)

    // Verify user is part of conversation
    const verifyResult = await pool.query(`
      SELECT id FROM conversations
      WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
    `, [conversationId, userId])

    if (verifyResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const result = await pool.query(`
      SELECT 
        m.id,
        m.sender_id,
        m.content,
        m.read,
        m.created_at,
        u.name as sender_name,
        u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
    `, [conversationId])

    const messages = result.rows.map(row => ({
      id: row.id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      senderAvatar: row.sender_avatar || row.sender_name?.substring(0, 2).toUpperCase() || 'U',
      content: row.content,
      read: row.read,
      createdAt: row.created_at,
    }))

    // Mark messages as read
    await pool.query(`
      UPDATE messages
      SET read = TRUE
      WHERE conversation_id = $1 AND sender_id != $2 AND read = FALSE
    `, [conversationId, userId])

    res.json({ messages })
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Send a message (also handled via Socket.io, but this is for persistence)
router.post('/messages', verifyToken, async (req, res) => {
  try {
    const userId = req.userId
    const { conversationId, content } = req.body

    if (!conversationId || !content) {
      return res.status(400).json({ error: 'Conversation ID and content are required' })
    }

    // Verify user is part of conversation
    const verifyResult = await pool.query(`
      SELECT id FROM conversations
      WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
    `, [conversationId, userId])

    if (verifyResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const result = await pool.query(`
      INSERT INTO messages (conversation_id, sender_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, created_at
    `, [conversationId, userId, content])

    // Update conversation updated_at
    await pool.query(`
      UPDATE conversations
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [conversationId])

    const message = {
      id: result.rows[0].id,
      conversationId,
      senderId: userId,
      content,
      createdAt: result.rows[0].created_at,
    }

    res.status(201).json({ message })
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router

