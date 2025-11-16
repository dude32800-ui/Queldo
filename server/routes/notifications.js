const express = require('express')
const { pool } = require('../database/connection')
const { verifyToken } = require('./auth')

const router = express.Router()

// Get user notifications
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.userId]
    )

    res.json({ notifications: result.rows })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Mark notification as read
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const { id } = req.params

    await pool.query(
      'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    )

    res.json({ message: 'Notification marked as read' })
  } catch (error) {
    console.error('Mark notification read error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create notification (helper function for other routes)
const createNotification = async (userId, type, title, message, link = null) => {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, message, link]
    )

    // Emit socket event if io is available
    // This would be done in the route that calls this function
  } catch (error) {
    console.error('Create notification error:', error)
  }
}

module.exports = router
module.exports.createNotification = createNotification

