const express = require('express')
const { pool } = require('../database/connection')

const router = express.Router()

// Get leaderboard
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.avatar,
        COUNT(DISTINCT st.id) as trades_count,
        COUNT(DISTINCT a.id) as applications_count
      FROM users u
      LEFT JOIN skill_trades st ON (st.poster_id = u.id OR st.applicant_id = u.id) 
        AND st.status = 'completed'
      LEFT JOIN applications a ON a.applicant_id = u.id AND a.status = 'accepted'
      GROUP BY u.id, u.name, u.avatar
      ORDER BY trades_count DESC, applications_count DESC
      LIMIT 50
    `)

    const leaderboard = result.rows.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      name: user.name,
      avatar: user.avatar || user.name?.substring(0, 2).toUpperCase() || 'U',
      trades: parseInt(user.trades_count) || 0,
      applications: parseInt(user.applications_count) || 0,
    }))

    res.json({ leaderboard })
  } catch (error) {
    console.error('Get leaderboard error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router

