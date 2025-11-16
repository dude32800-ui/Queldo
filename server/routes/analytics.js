const express = require('express')
const { pool } = require('../database/connection')
const { verifyToken } = require('./auth')

const router = express.Router()

// Get user analytics
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.userId

    // Get total trades (as poster or applicant)
    const tradesResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE st.poster_id = $1 OR st.applicant_id = $1) as total_trades,
        COUNT(*) FILTER (WHERE (st.poster_id = $1 OR st.applicant_id = $1) AND st.status = 'completed') as completed_trades
      FROM skill_trades st
    `, [userId])

    // Get applications
    const applicationsResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted
      FROM applications
      WHERE applicant_id = $1
    `, [userId])

    // Get average response time (time from application to acceptance)
    const responseTimeResult = await pool.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) as avg_hours
      FROM applications
      WHERE applicant_id = $1 AND status = 'accepted'
    `, [userId])

    // Get skills count
    const skillsResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE skill_type = 'offering') as offering,
        COUNT(*) FILTER (WHERE skill_type = 'seeking') as seeking
      FROM user_skills
      WHERE user_id = $1
    `, [userId])

    // Get recent activity
    const activityResult = await pool.query(`
      SELECT 
        'trade' as type,
        CONCAT('Completed trade with ', 
          CASE 
            WHEN st.poster_id = $1 THEN u2.name
            ELSE u1.name
          END
        ) as description,
        st.completed_at as timestamp
      FROM skill_trades st
      LEFT JOIN users u1 ON st.poster_id = u1.id
      LEFT JOIN users u2 ON st.applicant_id = u2.id
      WHERE (st.poster_id = $1 OR st.applicant_id = $1) 
        AND st.status = 'completed'
        AND st.completed_at IS NOT NULL
      
      UNION ALL
      
      SELECT 
        'application' as type,
        CONCAT('Application ', 
          CASE 
            WHEN a.status = 'accepted' THEN 'accepted'
            WHEN a.status = 'rejected' THEN 'rejected'
            ELSE 'pending'
          END,
          ' for listing #', a.listing_id
        ) as description,
        a.updated_at as timestamp
      FROM applications a
      WHERE a.applicant_id = $1
      
      UNION ALL
      
      SELECT 
        'skill' as type,
        CONCAT('Added skill: ', s.name) as description,
        us.created_at as timestamp
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.user_id = $1
      
      ORDER BY timestamp DESC
      LIMIT 10
    `, [userId])

    // Get skill growth (skills added over time)
    const skillGrowthResult = await pool.query(`
      SELECT 
        s.name as skill,
        COUNT(*) as count,
        MAX(us.created_at) as last_added
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.user_id = $1
      GROUP BY s.name
      ORDER BY count DESC, last_added DESC
      LIMIT 5
    `, [userId])

    // Get monthly stats
    const monthlyStatsResult = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month,
        COUNT(*) FILTER (WHERE type = 'trade') as trades,
        COUNT(*) FILTER (WHERE type = 'application') as applications
      FROM (
        SELECT created_at, 'trade' as type
        FROM skill_trades
        WHERE (poster_id = $1 OR applicant_id = $1) AND status = 'completed'
        
        UNION ALL
        
        SELECT created_at, 'application' as type
        FROM applications
        WHERE applicant_id = $1 AND status = 'accepted'
      ) combined
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) DESC
      LIMIT 6
    `, [userId])

    const trades = tradesResult.rows[0]
    const applications = applicationsResult.rows[0]
    const responseTime = responseTimeResult.rows[0]
    const skills = skillsResult.rows[0]
    const activities = activityResult.rows.map(row => ({
      id: row.type + row.timestamp,
      type: row.type,
      description: row.description,
      timestamp: formatTimestamp(row.timestamp),
    }))
    // For skill growth, we'll calculate based on recent additions
    // This is a simplified version - in production you'd track historical data
    const skillGrowth = skillGrowthResult.rows.map((row) => ({
      skill: row.skill,
      growth: Math.max(5, Math.min(20, parseInt(row.count) * 2)), // Based on skill count
      trend: parseInt(row.count) > 2 ? 'up' : 'down',
    }))
    const monthlyStats = monthlyStatsResult.rows.map(row => ({
      month: row.month,
      trades: parseInt(row.trades) || 0,
      applications: parseInt(row.applications) || 0,
    }))

    res.json({
      totalTrades: parseInt(trades.total_trades) || 0,
      completedTrades: parseInt(trades.completed_trades) || 0,
      pendingApplications: parseInt(applications.pending) || 0,
      acceptedApplications: parseInt(applications.accepted) || 0,
      averageResponseTime: parseFloat(responseTime.avg_hours) || 0,
      skillsOffered: parseInt(skills.offering) || 0,
      skillsSeeking: parseInt(skills.seeking) || 0,
      recentActivity: activities,
      skillGrowth: skillGrowth,
      monthlyStats: monthlyStats,
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown'
  
  const now = new Date()
  const time = new Date(timestamp)
  const diffMs = now - time
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return time.toLocaleDateString()
}

module.exports = router

